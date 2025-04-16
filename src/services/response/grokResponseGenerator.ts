
import { GrokRequestParams, GrokResponse } from '@/types/grok';
import { contextService } from '../regulatory/contextService';
import { grokApiService } from '../api/grokApiService';
import { createFinancialExpertSystemPrompt } from '../financial/systemPrompts';
import { detectFinancialExpertiseArea, isSimpleConversationalQuery } from '../financial/expertiseDetection';
import { generateFallbackResponse } from '../fallbackResponseService';
import { getGrokApiKey } from '../apiKeyService';

// Import refactored modules
import { contextEnhancer } from './modules/contextEnhancer';
import { queryAnalyzer } from './modules/queryAnalyzer';
import { responseOptimizer } from './modules/responseOptimizer';
import { responseEnhancer } from './modules/responseEnhancer';
import { responseFormatter } from './modules/responseFormatter';

export const grokResponseGenerator = {
  generateResponse: async (params: GrokRequestParams): Promise<GrokResponse> => {
    try {
      console.group('Hong Kong Financial Expert Response Generation');
      console.log('Input Query:', params.prompt);

      // Use provided API key or get from local storage
      const apiKey = params.apiKey || getGrokApiKey();
      
      // Log API key status (not the actual key) for debugging
      console.log('API Key available:', !!apiKey, apiKey ? `Key starts with: ${apiKey.substring(0, 4)}...` : 'No key');

      // Enhanced logging for fallback detection
      const fallbackLogging = {
        apiKeyAvailable: !!apiKey,
        queryType: '',
        contextAvailable: !!params.regulatoryContext,
        fallbackReason: ''
      };

      // Check if this might be FAQ related
      const isFaqQuery = params.prompt.toLowerCase().includes('faq') || 
                        params.prompt.toLowerCase().includes('continuing obligation') ||
                        params.prompt.match(/\b10\.4\b/);

      // Check if this is a simple conversational query
      const isSimpleQuery = isSimpleConversationalQuery(params.prompt);
      
      // IMPORTANT CHANGE: Even for simple queries, prioritize database content
      // Only use the simplified processing if there's no regulatory context after checking
      if (isSimpleQuery && !params.regulatoryContext) {
        console.log('Simple conversational query detected with no relevant database content, using streamlined processing');
        
        // Simplified system message for conversational queries
        const conversationalSystemMessage = 
          "You are a helpful virtual assistant with expertise in Hong Kong financial regulations. " +
          "For simple conversational queries, provide direct and concise responses while maintaining " +
          "a professional tone. If the user asks about your capabilities, explain that you specialize " +
          "in Hong Kong financial regulations, listing rules, and corporate actions.";
        
        // Prepare streamlined request for conversational queries
        const requestBody = {
          messages: [
            { role: 'system', content: conversationalSystemMessage },
            { role: 'user', content: params.prompt }
          ],
          model: "grok-3-mini-beta",
          temperature: 0.7,
          max_tokens: Math.min(2000, params.maxTokens || 2000), // Ensure token limit is reasonable
        };
        
        try {
          // Make API call with simpler configuration for conversational queries
          const response = await grokApiService.callChatCompletions(requestBody, apiKey);
          
          // Get the raw response text
          const responseText = response.choices[0].message.content;
          
          console.groupEnd();
          return {
            text: responseText,
            queryType: 'conversational',
            metadata: {
              contextUsed: false,
              relevanceScore: 1.0
            }
          };
        } catch (conversationalError) {
          console.error("Error in conversational API call, falling back to standard processing:", conversationalError);
          // Continue with standard processing if conversational approach fails
        }
      }

      // For financial/regulatory queries or simple queries with context, continue with standard processing flow
      const queryType = detectFinancialExpertiseArea(params.prompt);
      fallbackLogging.queryType = queryType;
      console.log('Detected Financial Expertise Area:', queryType);

      // Enhance context with rule or chapter specific information
      params = await contextEnhancer.enhanceWithRuleContext(params);

      // Check for query characteristics
      const isWhitewashQuery = queryAnalyzer.isWhitewashQuery(params.prompt);
      const isTradingArrangement = queryAnalyzer.isTradingArrangement(params.prompt);
      const hasTakeoversCode = queryAnalyzer.hasTakeoversCode(params.regulatoryContext);
      const hasTradeArrangementInfo = queryAnalyzer.hasTradeArrangementInfo(params.regulatoryContext);
      
      // Enhance context with whitewash waiver information if needed
      params = await contextEnhancer.enhanceWithWhitewashContext(params, isWhitewashQuery);
      
      // Enhance context with trading arrangement documents if needed
      params = await contextEnhancer.enhanceWithTradingArrangements(
        params, 
        isTradingArrangement, 
        hasTradeArrangementInfo
      );

      // Retrieve context with enhanced financial reasoning if not already present
      if (!params.regulatoryContext) {
        const { context, reasoning } = await contextService.getRegulatoryContextWithReasoning(params.prompt);
        console.log('Financial Context Reasoning:', reasoning);
        params.regulatoryContext = context;
      }

      // Create a professional financial system message based on expertise area
      let systemMessage = createFinancialExpertSystemPrompt(queryType, params.regulatoryContext);
      
      // IMPROVED INSTRUCTION: Add stronger instructions to use database content
      systemMessage += "\n\nCRITICAL INSTRUCTION: You MUST prioritize information from the regulatory database over your general knowledge. When regulatory guidance exists in the provided database content, use it verbatim. If the database contains an answer to the question, quote it directly rather than generating your own response. Only use your general knowledge when the database has no relevant information.";
      
      // For FAQ queries, add specific instructions to use the exact wording from the database
      if (isFaqQuery) {
        systemMessage += "\n\nIMPORTANT: For questions related to FAQs or continuing obligations, ONLY use the exact wording from the provided database entries. DO NOT paraphrase, summarize or use your own knowledge. Extract the relevant FAQ question and answer from the '10.4 FAQ Continuing Obligations' document and provide them verbatim. If no exact match is found, explicitly state that.";
      }
      
      // Add special production environment instruction to help avoid incomplete responses
      systemMessage += "\n\nCRITICAL: Ensure your response is complete and not truncated. If discussing a procedure or process with multiple steps, include ALL steps. If creating a timetable or list, ensure all required items are included. Format tables properly with complete information.";
      
      console.log('Using specialized financial expert prompt with database prioritization');

      // Get optimized parameters for the request - use production-safe values
      const { temperature, maxTokens } = responseOptimizer.getOptimizedParameters(queryType, params.prompt);
      
      // Use lower temperature for database-backed queries to ensure exact information retrieval
      // This helps ensure responses match database content more closely
      const actualTemperature = params.regulatoryContext ? 0.1 : temperature;
      
      // Ensure token count is within safe limits for production environments
      const safeMaxTokens = Math.min(3500, maxTokens);

      // Prepare request body
      const requestBody = {
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: params.prompt }
        ],
        model: "grok-3-mini-beta",
        temperature: actualTemperature,
        max_tokens: safeMaxTokens,
      };

      try {
        // Make API call with professional financial expertise configuration
        const response = await grokApiService.callChatCompletions(requestBody, apiKey);
        
        // Get the raw response text
        const responseText = response.choices[0].message.content;
        
        // Calculate relevance score for context
        const relevanceScore = responseOptimizer.calculateRelevanceScore(responseText, params.prompt, queryType);
        
        // Enhance response with metadata
        const finalResponse = responseEnhancer.enhanceResponse(
          responseText, 
          queryType, 
          !!params.regulatoryContext, 
          relevanceScore, 
          params.prompt
        );

        // Before returning fallback, log detailed information
        if (typeof finalResponse === 'object' && finalResponse.text.includes("Based on your query about")) {
          fallbackLogging.fallbackReason = 'Automatic fallback due to incomplete response generation';
          console.warn('Fallback Response Triggered:', fallbackLogging);
        }

        console.groupEnd();
        return finalResponse;
      } catch (apiError) {
        console.error("API call failed, attempting backup approach with simplified parameters:", apiError);
        
        // If first attempt fails, try again with more conservative parameters
        try {
          // Use more conservative parameters for backup attempt
          const backupRequestBody = {
            messages: [
              { role: 'system', content: "You are a Hong Kong financial regulations expert. Provide accurate information based on Hong Kong listing rules, takeovers code, and corporate finance regulations." },
              { role: 'user', content: params.prompt }
            ],
            model: "grok-3-mini-beta",
            temperature: 0.1,  // Very low temperature for factual accuracy
            max_tokens: 2000,  // Conservative token limit
          };
          
          console.log("Attempting backup API call with simplified parameters");
          const backupResponse = await grokApiService.callChatCompletions(backupRequestBody, apiKey);
          
          const backupResponseText = backupResponse.choices[0].message.content;
          
          console.groupEnd();
          return {
            text: backupResponseText,
            queryType: queryType || 'general',
            metadata: {
              contextUsed: false,
              relevanceScore: 0.8,
              isBackupResponse: true
            }
          };
        } catch (backupError) {
          // If both attempts fail, fall back to fallback response
          console.error('Both API attempts failed, using fallback:', backupError);
          console.groupEnd();
          
          // Generate fallback with more context about the error
          return generateFallbackResponse(params.prompt, 
            apiError instanceof Error ? apiError.message : 'API connection failed');
        }
      }
    } catch (error) {
      console.error('Hong Kong Financial Expert Response Error:', error);
      console.group('Fallback Response Details');
      console.log('Error Type:', error instanceof Error ? error.name : 'Unknown Error');
      console.log('Error Message:', error instanceof Error ? error.message : error);
      console.groupEnd();
      console.groupEnd();
      
      // Generate fallback with more context about the error
      return generateFallbackResponse(params.prompt, error instanceof Error ? error.message : 'Unexpected error');
    }
  },
};


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

      // Enhanced logging for fallback detection
      const fallbackLogging = {
        apiKeyAvailable: !!apiKey,
        queryType: '',
        contextAvailable: !!params.regulatoryContext,
        fallbackReason: ''
      };

      // Check if this is a simple conversational query
      const isSimpleQuery = isSimpleConversationalQuery(params.prompt);
      
      if (isSimpleQuery) {
        console.log('Simple conversational query detected, using streamlined processing');
        
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
          max_tokens: params.maxTokens || 2000,
        };
        
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
      }

      // For financial/regulatory queries, continue with standard processing flow
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
      const systemMessage = createFinancialExpertSystemPrompt(queryType, params.regulatoryContext);
      console.log('Using specialized financial expert prompt');

      // Get optimized parameters for the request
      const { temperature, maxTokens } = responseOptimizer.getOptimizedParameters(queryType, params.prompt);

      // Prepare request body
      const requestBody = {
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: params.prompt }
        ],
        model: "grok-3-mini-beta",
        temperature: temperature,
        max_tokens: maxTokens,
      };

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

      // You can add more specific logging here to capture reasons for fallback

      console.groupEnd();
      return finalResponse;
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

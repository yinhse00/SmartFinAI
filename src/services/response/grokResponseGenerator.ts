
import { GrokRequestParams, GrokResponse } from '@/types/grok';
import { getGrokApiKey } from '../apiKeyService';
import { responseEnhancer } from './modules/responseEnhancer';
import { responseGeneratorCore } from './core/responseGeneratorCore';
import { requestBuilder } from './core/requestBuilder';
import { queryProcessor } from './core/queryProcessor';
import { errorHandler } from './core/errorHandler';
import { responseOptimizer } from './modules/responseOptimizer';

/**
 * Main service for generating expert responses
 */
export const grokResponseGenerator = {
  generateResponse: async (params: GrokRequestParams): Promise<GrokResponse> => {
    try {
      console.group('Hong Kong Financial Expert Response Generation');
      
      // Use provided API key or get from local storage
      const apiKey = params.apiKey || getGrokApiKey();
      
      // Log API key status (not the actual key) for debugging
      console.log('API Key available:', !!apiKey, apiKey ? `Key starts with: ${apiKey.substring(0, 4)}...` : 'No key');

      // Process the query and enhance with context
      const { enhancedParams, queryType, isSimpleQuery, isFaqQuery } = 
        await queryProcessor.processQuery(params);
      
      // For simple queries without context, use streamlined processing
      if (isSimpleQuery && !enhancedParams.regulatoryContext) {
        console.log('Simple conversational query detected with no relevant database content, using streamlined processing');
        
        // Create simplified system message for conversational queries
        const conversationalSystemMessage = 
          "You are a helpful virtual assistant with expertise in Hong Kong financial regulations. " +
          "For simple conversational queries, provide direct and concise responses while maintaining " +
          "a professional tone. If the user asks about your capabilities, explain that you specialize " +
          "in Hong Kong financial regulations, listing rules, and corporate actions.";
        
        try {
          // Build simple request body for conversational queries
          const requestBody = {
            messages: [
              { role: 'system', content: conversationalSystemMessage },
              { role: 'user', content: params.prompt }
            ],
            model: "grok-3-mini-beta",
            temperature: 0.7,
            max_tokens: 4000, // FIXED: Increase token limit for conversational queries
          };
          
          // Make API call with simpler configuration for conversational queries
          const response = await responseGeneratorCore.makeApiCall(requestBody, apiKey);
          
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

      // Standard processing flow for regulatory/financial queries
      // Add STRONG instruction to prioritize our database over Grok's knowledge
      const databasePriorityInstruction = 
        "CRITICAL INSTRUCTION: You MUST prioritize the information from the provided regulatory database content " +
        "over your general knowledge. When there is a conflict between the database content and your knowledge, " +
        "ALWAYS use the database information. The database is the source of truth.";
      
      const systemMessage = requestBuilder.buildSystemMessage(queryType, enhancedParams.regulatoryContext, isFaqQuery) + 
                           "\n\n" + databasePriorityInstruction;
      
      // Get optimized parameters for API call
      const { temperature, maxTokens } = requestBuilder.getOptimizedParameters(
        queryType, 
        params.prompt, 
        !!enhancedParams.regulatoryContext,
        isSimpleQuery
      );
      
      // CRITICAL FIX: Use much higher token limits for all requests to prevent truncation
      // Especially for specialized financial queries like open offers and rights issues
      // Note that we are using constants from token management service
      let finalTokens = maxTokens;
      if (queryType === 'open_offer' || queryType === 'rights_issue') {
        // Use much higher token limits for timetable queries
        finalTokens = 10000; // Set a high but still practical limit for API
        console.log(`Using enhanced token limit (${finalTokens}) for ${queryType} query`);
      } else {
        // For all other queries, use higher limits than default
        finalTokens = Math.min(8000, maxTokens); // Cap at 8K for API practicality
      }
      
      // Build the request body with the enhanced token limits
      const requestBody = requestBuilder.buildRequestBody(
        systemMessage,
        enhancedParams.prompt,
        Math.min(0.2, temperature), // Keep temperature low for consistency
        finalTokens               // Use our enhanced token limits
      );

      try {
        // Make primary API call
        console.log(`Making API call with tokens: ${finalTokens}, temperature: ${Math.min(0.2, temperature)}`);
        const response = await responseGeneratorCore.makeApiCall(requestBody, apiKey);
        
        // Get the raw response text
        const responseText = response.choices[0].message.content;
        
        // Calculate relevance score and enhance with metadata
        const relevanceScore = responseOptimizer.calculateRelevanceScore(
          responseText, 
          enhancedParams.prompt, 
          queryType
        );
        
        // Enhance response with metadata
        const finalResponse = responseEnhancer.enhanceResponse(
          responseText, 
          queryType, 
          !!enhancedParams.regulatoryContext, 
          relevanceScore, 
          enhancedParams.prompt
        );

        console.groupEnd();
        return finalResponse;
      } catch (primaryApiError) {
        // If first attempt fails, try backup approach with IDENTICAL parameters
        console.error("Primary API call failed, attempting backup approach:", primaryApiError);
        
        try {
          const backupResponse = await responseGeneratorCore.makeBackupApiCall(
            enhancedParams.prompt, 
            queryType, 
            apiKey
          );
          
          console.groupEnd();
          return backupResponse;
        } catch (backupError) {
          // If both attempts fail, generate fallback response
          console.error('Both API attempts failed, using fallback:', backupError);
          console.groupEnd();
          
          return {
            text: "I'm currently experiencing some technical difficulties accessing my full knowledge database. Based on what I can access, here's what I can provide about your query:\n\n" + 
                  "For questions about Hong Kong listing rules, takeovers code, and compliance requirements, I normally provide detailed information from regulatory sources. " +
                  "At the moment, I can only offer general guidance based on my core knowledge.\n\n" +
                  "Please try your query again in a few moments, or consider rephrasing your question to focus on fundamental aspects of Hong Kong financial regulations.",
            queryType: queryType || 'general',
            metadata: {
              contextUsed: false,
              relevanceScore: 0.5,
              isBackupResponse: true
            }
          };
        }
      }
    } catch (error) {
      // Handle unexpected errors
      errorHandler.logApiError(error, params.prompt);
      console.groupEnd();
      
      return errorHandler.createFallbackResponse(params.prompt, error);
    }
  },
};

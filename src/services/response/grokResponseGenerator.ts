
import { GrokRequestParams, GrokResponse } from '@/types/grok';
import { getGrokApiKey } from '../apiKeyService';
import { responseEnhancer } from './modules/responseEnhancer';
import { responseGeneratorCore } from './core/responseGeneratorCore';
import { requestBuilder } from './core/requestBuilder';
import { queryProcessor } from './core/queryProcessor';
import { errorHandler } from './core/errorHandler';
import { responseOptimizer } from './modules/responseOptimizer'; // Fixed missing import

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
            max_tokens: Math.min(2000, params.maxTokens || 2000), // Ensure token limit is reasonable
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
      // Build system message with enhanced context awareness
      const systemMessage = requestBuilder.buildSystemMessage(queryType, enhancedParams.regulatoryContext, isFaqQuery);
      
      // Get optimized parameters for API call
      const { temperature, maxTokens } = requestBuilder.getOptimizedParameters(
        queryType, 
        params.prompt, 
        !!enhancedParams.regulatoryContext,
        isSimpleQuery
      );
      
      // Prepare request body
      const requestBody = requestBuilder.buildRequestBody(
        systemMessage,
        enhancedParams.prompt,
        temperature,
        maxTokens
      );

      try {
        // Make primary API call
        console.log(`Making API call with tokens: ${maxTokens}, temperature: ${temperature}`);
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
        // If first attempt fails, try backup approach
        try {
          console.error("Primary API call failed, attempting backup approach:", primaryApiError);
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
          
          return errorHandler.createFallbackResponse(enhancedParams.prompt, primaryApiError);
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

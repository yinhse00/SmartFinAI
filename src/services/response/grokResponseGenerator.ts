
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

      // Standard processing flow for all queries
      // Add STRONG instruction to prioritize database over Grok's knowledge
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
      
      // OPTIMIZATION: Use higher token limits for all requests to prevent truncation
      // Especially for specialized financial queries like open offers and rights issues
      let finalTokens = maxTokens;
      if (queryType === 'open_offer' || queryType === 'rights_issue') {
        // Use much higher token limits for timetable queries
        finalTokens = 25000; // Set a high but still practical limit for API
        console.log(`Using enhanced token limit (${finalTokens}) for ${queryType} query`);
      } else {
        // For all other queries, use higher limits than default
        finalTokens = Math.min(15000, maxTokens); // Cap at 15K for API practicality
      }
      
      // Build the request body with the enhanced token limits
      const requestBody = requestBuilder.buildRequestBody(
        systemMessage,
        enhancedParams.prompt,
        Math.min(0.5, temperature), // Keep temperature balanced for consistency
        finalTokens               // Use our enhanced token limits
      );

      try {
        // Make primary API call
        console.log(`Making API call with tokens: ${finalTokens}, temperature: ${Math.min(0.5, temperature)}`);
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

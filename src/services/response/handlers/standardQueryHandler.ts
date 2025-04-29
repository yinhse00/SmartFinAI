
import { GrokRequestParams, GrokResponse } from '@/types/grok';
import { responseGeneratorCore } from '../core/responseGeneratorCore';
import { requestBuilder } from '../core/requestBuilder';
import { errorHandler } from '../core/errorHandler';
import { responseOptimizer } from '../modules/responseOptimizer';
import { responseEnhancer } from '../modules/responseEnhancer';
import { hashUtils } from '../utils/hashUtils';

/**
 * Handles standard financial and regulatory queries
 */
export const standardQueryHandler = {
  /**
   * Process a standard regulatory or financial query
   */
  processQuery: async (
    enhancedParams: GrokRequestParams,
    queryType: string,
    apiKey: string,
    requestId: string,
    isProduction: boolean
  ): Promise<GrokResponse> => {
    try {
      // Standard processing flow for regulatory/financial queries
      // Add STRONG instruction to prioritize our database over Grok's knowledge
      const databasePriorityInstruction = 
        "CRITICAL INSTRUCTION: You MUST prioritize the information from the provided regulatory database content " +
        "over your general knowledge. When there is a conflict between the database content and your knowledge, " +
        "ALWAYS use the database information. The database is the source of truth.";
      
      const environmentConsistencyInstruction = 
        "CRITICAL: Ensure your responses are identical regardless of deployment environment. " +
        "Do not vary response content based on deployment context. Apply the same reasoning " +
        "and content generation across all environments. You must produce exactly the same response " +
        "every time you receive the same input, regardless of environment or other variables.";
      
      const systemMessage = requestBuilder.buildSystemMessage(queryType, enhancedParams.regulatoryContext, !!enhancedParams.prompt?.includes('faq')) + 
                           "\n\n" + databasePriorityInstruction +
                           "\n\n" + environmentConsistencyInstruction;
      
      // Get optimized parameters for API call
      const { temperature, maxTokens } = requestBuilder.getOptimizedParameters(
        queryType, 
        enhancedParams.prompt || '', 
        !!enhancedParams.regulatoryContext,
        false
      );
      
      // CRITICAL FIX: Use much higher token limits for all requests to prevent truncation
      // Especially for specialized financial queries like open offers and rights issues
      let finalTokens = maxTokens;
      if (queryType === 'open_offer' || queryType === 'rights_issue') {
        // Use much higher token limits for timetable queries
        finalTokens = 10000; // Set a high but still practical limit for API
        console.log(`Using enhanced token limit (${finalTokens}) for ${queryType} query`);
      } else {
        // For all other queries, use higher limits than default
        finalTokens = Math.min(8000, maxTokens); // Cap at 8K for API practicality
      }
      
      // Create a content hash for deterministic processing
      const contentHash = hashUtils.createSimpleHash(enhancedParams.prompt || '');
      
      // Build the request body with the enhanced token limits
      const requestBody = requestBuilder.buildRequestBody(
        systemMessage,
        enhancedParams.prompt || '',
        Math.min(0.05, temperature), // Keep temperature extremely low for consistency
        finalTokens               // Use our enhanced token limits
      );
      
      // Add environment consistency flags
      requestBody.environmentConsistency = true;
      requestBody.deployedVersion = '2.2.0'; // Update version tracking
      requestBody.requestId = requestId;
      requestBody.envSignature = 'unified-env-2.0';
      requestBody.useStableParameters = true;
      requestBody.seed = contentHash; // Use deterministic seed
      
      console.log(`Making API call for request ${requestId} with model: ${requestBody.model}, temperature: ${requestBody.temperature}`);
      
      // Make primary API call
      console.log(`Making API call with tokens: ${finalTokens}, temperature: ${requestBody.temperature}, seed: ${requestBody.seed}`);
      const startTime = Date.now();
      const response = await responseGeneratorCore.makeApiCall(requestBody, apiKey);
      const responseTime = Date.now() - startTime;
      console.log(`API response received in ${responseTime}ms for request ${requestId}`);
      
      // FIX: Add comprehensive null checks for response and choices
      // Access content safely with proper null checking
      let responseText = '';
      if (response && 
          response.choices && 
          Array.isArray(response.choices) && 
          response.choices.length > 0 && 
          response.choices[0] && // Add explicit check for first item
          response.choices[0].message) {
        responseText = response.choices[0].message.content || '';
      }
      
      // Calculate relevance score and enhance with metadata
      const relevanceScore = responseOptimizer.calculateRelevanceScore(
        responseText, 
        enhancedParams.prompt || '', 
        queryType
      );
      
      // Enhance response with metadata
      const finalResponse = responseEnhancer.enhanceResponse(
        responseText, 
        queryType, 
        !!enhancedParams.regulatoryContext, 
        relevanceScore, 
        enhancedParams.prompt || ''
      );
      
      // Add environment metadata for debugging
      if (!finalResponse.metadata) {
        finalResponse.metadata = {};
      }
      
      finalResponse.metadata.environmentInfo = {
        requestId,
        isProduction,
        envSignature: 'unified-env-2.0',
        processingTime: responseTime
      };

      return finalResponse;
    } catch (error) {
      throw error; // Let the main handler catch and process this
    }
  }
};

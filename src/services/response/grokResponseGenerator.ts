
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
      
      // Create a deterministic request ID based on input
      const requestId = `req_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
      console.log(`Processing request: ${requestId}`);
      
      // Log API key status (not the actual key) for debugging
      console.log('API Key available:', !!apiKey, apiKey ? `Key starts with: ${apiKey.substring(0, 4)}...` : 'No key');
      console.log('Environment:', process.env.NODE_ENV || 'unknown', 'Query:', params.prompt?.substring(0, 50) + '...');

      // Process the query and enhance with context
      const { enhancedParams, queryType, isSimpleQuery, isFaqQuery } = 
        await queryProcessor.processQuery(params);
      
      // Ensure consistent behavior across environments
      const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
      console.log('Running in production mode:', isProduction);
      console.log('Using environment consistency settings for request:', requestId);
      
      // Add environment signature to params
      enhancedParams.envSignature = 'unified-env-2.0';
      enhancedParams.requestId = requestId;
      enhancedParams.consistencyMode = true;
      
      // For simple queries without context, use streamlined processing
      if (isSimpleQuery && !enhancedParams.regulatoryContext) {
        console.log('Simple conversational query detected with no relevant database content, using streamlined processing');
        
        // Create simplified system message for conversational queries
        const conversationalSystemMessage = 
          "You are a helpful virtual assistant with expertise in Hong Kong financial regulations. " +
          "For simple conversational queries, provide direct and concise responses while maintaining " +
          "a professional tone. If the user asks about your capabilities, explain that you specialize " +
          "in Hong Kong financial regulations, listing rules, and corporate actions. " +
          "CRITICAL: Always provide IDENTICAL responses in all environments when receiving the same input.";
        
        try {
          // Build simple request body for conversational queries
          const requestBody = {
            messages: [
              { role: 'system', content: conversationalSystemMessage },
              { role: 'user', content: params.prompt }
            ],
            model: "grok-3-mini-beta",
            temperature: 0.05, // Use extremely low temperature for consistency
            max_tokens: 4000,
            environmentConsistency: true,
            requestId: requestId,
            envSignature: 'unified-env-2.0',
            useStableParameters: true,
            seed: this.createSimpleHash(params.prompt || '') // Use consistent seed
          };
          
          // Make API call with simpler configuration for conversational queries
          const response = await responseGeneratorCore.makeApiCall(requestBody, apiKey);
          
          // Get the raw response text
          const responseText = response?.choices?.[0]?.message?.content || '';
          
          console.groupEnd();
          return {
            text: responseText,
            queryType: 'conversational',
            metadata: {
              contextUsed: false,
              relevanceScore: 1.0,
              environmentInfo: {
                requestId,
                isProduction,
                envSignature: 'unified-env-2.0'
              }
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
      
      const environmentConsistencyInstruction = 
        "CRITICAL: Ensure your responses are identical regardless of deployment environment. " +
        "Do not vary response content based on deployment context. Apply the same reasoning " +
        "and content generation across all environments. You must produce exactly the same response " +
        "every time you receive the same input, regardless of environment or other variables.";
      
      const systemMessage = requestBuilder.buildSystemMessage(queryType, enhancedParams.regulatoryContext, isFaqQuery) + 
                           "\n\n" + databasePriorityInstruction +
                           "\n\n" + environmentConsistencyInstruction;
      
      // Get optimized parameters for API call
      const { temperature, maxTokens } = requestBuilder.getOptimizedParameters(
        queryType, 
        params.prompt || '', 
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
      
      // Create a content hash for deterministic processing
      const contentHash = this.createSimpleHash(params.prompt || '');
      
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
      
      try {
        // Make primary API call
        console.log(`Making API call with tokens: ${finalTokens}, temperature: ${requestBody.temperature}, seed: ${requestBody.seed}`);
        const startTime = Date.now();
        const response = await responseGeneratorCore.makeApiCall(requestBody, apiKey);
        const responseTime = Date.now() - startTime;
        console.log(`API response received in ${responseTime}ms for request ${requestId}`);
        
        // Get the raw response text
        const responseText = response?.choices?.[0]?.message?.content || '';
        
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

        console.groupEnd();
        return finalResponse;
      } catch (primaryApiError) {
        // If first attempt fails, try backup approach with IDENTICAL parameters
        console.error(`Primary API call failed for request ${requestId}, attempting backup approach:`, primaryApiError);
        
        try {
          const startTime = Date.now();
          const backupResponse = await responseGeneratorCore.makeBackupApiCall(
            enhancedParams.prompt || '', 
            queryType, 
            apiKey
          );
          const responseTime = Date.now() - startTime;
          console.log(`Backup API response received in ${responseTime}ms for request ${requestId}`);
          
          // Add environment metadata for debugging
          if (!backupResponse.metadata) {
            backupResponse.metadata = {};
          }
          
          backupResponse.metadata.environmentInfo = {
            requestId,
            isProduction,
            envSignature: 'unified-env-2.0',
            processingTime: responseTime,
            isBackupResponse: true
          };
          
          console.groupEnd();
          return backupResponse;
        } catch (backupError) {
          // If both attempts fail, generate fallback response
          console.error(`Both API attempts failed for request ${requestId}, using fallback:`, backupError);
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
              isBackupResponse: true,
              environmentInfo: {
                requestId,
                isProduction,
                envSignature: 'unified-env-2.0',
                error: true
              }
            }
          };
        }
      }
    } catch (error) {
      // Handle unexpected errors
      errorHandler.logApiError(error, params.prompt || '');
      console.groupEnd();
      
      return errorHandler.createFallbackResponse(params.prompt || '', error);
    }
  },
  
  // Simple deterministic hashing function 
  createSimpleHash(text: string): number {
    let hash = 0;
    if (!text || text.length === 0) return hash;
    
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash);
  }
};

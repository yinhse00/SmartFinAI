import { GrokRequestParams, GrokResponse } from '@/types/grok';
import { getGrokApiKey } from '../apiKeyService';
import { queryProcessor } from './core/queryProcessor';
import { errorHandler } from './core/errorHandler';
import { conversationalQueryHandler } from './handlers/conversationalQueryHandler';
import { standardQueryHandler } from './handlers/standardQueryHandler';
import { backupQueryHandler } from './handlers/backupQueryHandler';
import { hashUtils } from './utils/hashUtils';

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
        const conversationalResponse = await conversationalQueryHandler.processQuery(
          enhancedParams, 
          apiKey, 
          requestId, 
          isProduction
        );
        
        if (conversationalResponse) {
          console.groupEnd();
          return conversationalResponse;
        }
        // If conversational handling fails, continue with standard processing
      }

      try {
        // Standard processing with the enhanced parameters
        const standardResponse = await standardQueryHandler.processQuery(
          enhancedParams,
          queryType,
          apiKey,
          requestId,
          isProduction
        );
        
        console.groupEnd();
        return standardResponse;
      } catch (primaryApiError) {
        // If first attempt fails, try backup approach
        console.error(`Primary API call failed for request ${requestId}, attempting backup approach:`, primaryApiError);
        
        try {
          const backupResponse = await backupQueryHandler.processBackup(
            enhancedParams.prompt || '',
            queryType,
            apiKey,
            requestId,
            isProduction
          );
          
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
  
  // Simple deterministic hashing function - moving to utils but keeping reference here for backward compatibility
  createSimpleHash: hashUtils.createSimpleHash
};

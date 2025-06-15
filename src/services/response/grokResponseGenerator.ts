
import { GrokRequestParams, GrokResponse } from '@/types/grok';
import { getGrokApiKey } from '../apiKeyService';
import { responseEnhancer } from './modules/responseEnhancer';
import { responseGeneratorCore } from './core/responseGeneratorCore';
import { requestBuilder } from './core/requestBuilder';
import { queryProcessor } from './core/queryProcessor';
import { errorHandler } from './core/errorHandler';
import { responseOptimizer } from './modules/responseOptimizer';
import { databaseContentValidator } from './modules/databaseContentValidator';

/**
 * Main service for generating expert responses with enhanced database accuracy
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

      // ENHANCED: Add CRITICAL database content preservation instructions
      const databasePreservationInstruction = 
        "\n\n=== CRITICAL DATABASE CONTENT PRESERVATION INSTRUCTIONS ===\n" +
        "The regulatory database content provided is AUTHORITATIVE and EXACT. You MUST:\n" +
        "1. PRESERVE ALL EXACT RULE REFERENCES (e.g., 'Rule 8.05(1)(a)' must stay 'Rule 8.05(1)(a)', NOT 'Rule 8.05(1)')\n" +
        "2. NEVER simplify, generalize, or modify rule numbers from database content\n" +
        "3. Quote database rule references VERBATIM - no paraphrasing allowed\n" +
        "4. When database says 'Rule X.XX(Y)(Z)', your response MUST say 'Rule X.XX(Y)(Z)'\n" +
        "5. Treat database content as EXACT REGULATORY TEXT that cannot be altered\n" +
        "=== END CRITICAL INSTRUCTIONS ===\n\n";
      
      // Standard processing flow for all queries with enhanced database priority
      const systemMessage = databasePreservationInstruction + 
                           requestBuilder.buildSystemMessage(queryType, enhancedParams.regulatoryContext, isFaqQuery) + 
                           databasePreservationInstruction; // Repeat for emphasis
      
      // Get optimized parameters for API call
      const { temperature, maxTokens } = requestBuilder.getOptimizedParameters(
        queryType, 
        params.prompt, 
        !!enhancedParams.regulatoryContext,
        isSimpleQuery
      );
      
      // Use higher token limits for all requests to prevent truncation
      let finalTokens = maxTokens;
      if (queryType === 'open_offer' || queryType === 'rights_issue') {
        finalTokens = 25000;
        console.log(`Using enhanced token limit (${finalTokens}) for ${queryType} query`);
      } else {
        finalTokens = Math.min(15000, maxTokens);
      }
      
      // Build the request body with enhanced instructions
      const requestBody = requestBuilder.buildRequestBody(
        systemMessage,
        enhancedParams.prompt,
        Math.min(0.5, temperature),
        finalTokens
      );

      try {
        // Make primary API call
        console.log(`Making API call with enhanced database preservation instructions`);
        const response = await responseGeneratorCore.makeApiCall(requestBody, apiKey);
        
        // Get the raw response text
        const responseText = response.choices[0].message.content;
        
        // ENHANCED: Validate database content preservation
        const validationResult = databaseContentValidator.validateDatabaseAccuracy(
          responseText,
          enhancedParams.regulatoryContext || '',
          enhancedParams.prompt
        );
        
        // Log validation results
        if (!validationResult.isAccurate) {
          console.warn('Database content accuracy issues detected:', validationResult.issues);
        }
        
        // Apply corrections if needed
        let correctedResponseText = responseText;
        if (validationResult.corrections && validationResult.corrections.length > 0) {
          console.log('Applying database accuracy corrections...');
          correctedResponseText = databaseContentValidator.applyCorrections(
            responseText,
            validationResult.corrections
          );
        }
        
        // Calculate relevance score and enhance with metadata
        const relevanceScore = responseOptimizer.calculateRelevanceScore(
          enhancedParams.prompt, 
          correctedResponseText
        );
        
        // Enhance response with metadata including database accuracy info
        const finalResponse = responseEnhancer.enhanceResponse(
          correctedResponseText, 
          queryType, 
          !!enhancedParams.regulatoryContext, 
          relevanceScore, 
          enhancedParams.prompt
        );

        // Add database accuracy metadata
        finalResponse.metadata = {
          ...finalResponse.metadata,
          databaseAccuracy: {
            isAccurate: validationResult.isAccurate,
            correctionsMade: validationResult.corrections?.length > 0,
            preservationScore: validationResult.preservationScore
          }
        };

        console.groupEnd();
        return finalResponse;
      } catch (primaryApiError) {
        // If first attempt fails, try backup approach
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
      errorHandler.logApiError(error, params.prompt);
      console.groupEnd();
      
      return errorHandler.createFallbackResponse(params.prompt, error);
    }
  },
};

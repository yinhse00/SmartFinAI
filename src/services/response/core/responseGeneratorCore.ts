
import { grokApiService } from '../../api/grokApiService';
import { generateFallbackResponse } from '../../fallbackResponseService';
import { responseEnhancer } from '../modules/responseEnhancer';
import { tokenManagementService } from '../modules/tokenManagementService';

/**
 * Core response generation functionality with quality-focused optimizations
 */
export const responseGeneratorCore = {
  makeApiCall: async (requestBody: any, apiKey: string) => {
    try {
      console.log("Making API call with optimized parameters");
      
      // Check for batch request
      const isBatchRequest = typeof requestBody.messages?.find?.(m => m.role === 'user')?.content === 'string' &&
                           requestBody.messages.find(m => m.role === 'user').content.includes('[CONTINUATION_PART_');
      
      const userPrompt = requestBody.messages?.find?.(m => m.role === 'user')?.content || '';
      
      // Detect if this is a complex financial query
      const isComplexFinancialQuery = 
        userPrompt.toLowerCase().includes('rights issue') ||
        userPrompt.toLowerCase().includes('timetable') ||
        userPrompt.toLowerCase().includes('takeovers code') ||
        userPrompt.toLowerCase().includes('connected transaction') ||
        userPrompt.toLowerCase().includes('chapter 14') ||
        userPrompt.toLowerCase().includes('chapter 14a') ||
        userPrompt.length > 200;
      
      // Determine optimal token limit with appropriate values
      const effectiveTokenLimit = tokenManagementService.getTokenLimit({
        queryType: requestBody.queryType || 'general',
        prompt: userPrompt,
        isRetryAttempt: false,
        isBatchRequest,
        isComplexQuery: isComplexFinancialQuery
      });
      
      // Apply optimal token limits
      requestBody.max_tokens = requestBody.max_tokens || effectiveTokenLimit;
      
      // Use balanced temperature for better quality responses
      if (!requestBody.temperature) {
        requestBody.temperature = tokenManagementService.getTemperature({
          queryType: requestBody.queryType || 'general',
          prompt: userPrompt,
          isComplexQuery: isComplexFinancialQuery
        });
      }
      
      // Smart model selection - use appropriate model based on query complexity
      const isInternalProcessing = requestBody.metadata?.internalProcessing === true;
      if (!requestBody.model) {
        // Always use beta for complex financial queries and final responses
        if (isComplexFinancialQuery || !isInternalProcessing) {
          requestBody.model = 'grok-3-beta';
        } else {
          requestBody.model = 'grok-3-mini';
        }
      }
      
      // Forward request to API client
      return await grokApiService.callChatCompletions(requestBody, apiKey);
    } catch (error) {
      console.error('Primary API call failed:', error);
      throw error;
    }
  },
  
  makeBackupApiCall: async (prompt: string, queryType: string | null, apiKey: string) => {
    try {
      console.log('Attempting backup API call with optimized parameters');
      
      // Enhanced system prompt for backup calls
      const systemPrompt = 'You are a financial regulatory expert specializing in Hong Kong regulations. Provide accurate, thorough information.';
      
      // Determine if this is a complex query
      const isComplexQuery = 
        prompt.toLowerCase().includes('rights issue') || 
        prompt.toLowerCase().includes('timetable') ||
        prompt.toLowerCase().includes('takeovers code') ||
        prompt.toLowerCase().includes('connected transaction') ||
        prompt.length > 200;
      
      // Optimized backup request with appropriate model
      const backupRequestBody = {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: isComplexQuery ? "grok-3-beta" : "grok-3-mini",
        temperature: 0.4,
        max_tokens: isComplexQuery ? 15000 : 8000
      };
      
      return await grokApiService.callChatCompletions(backupRequestBody, apiKey);
    } catch (backupError) {
      console.error('All backup API calls failed:', backupError);
      throw backupError;
    }
  },
  
  checkAndHandleTokenLimit: (responseText: string, tokenCount: number): {
    truncated: boolean,
    text: string
  } => {
    // Define a token limit constant - using higher value for more complete responses
    const DEFAULT_TOKEN_LIMIT = 10000; // Increased back from 5000
    
    // If token count is near limit, mark as truncated
    if (tokenCount > DEFAULT_TOKEN_LIMIT * 0.9) {
      console.log(`Response near token limit (${tokenCount}), marking as truncated`);
      return {
        truncated: true,
        text: responseText + "\n\n[Response truncated due to length]"
      };
    }
    
    return {
      truncated: false,
      text: responseText
    };
  }
};


import { grokApiService } from '../../api/grokApiService';
import { generateFallbackResponse } from '../../fallbackResponseService';
import { responseEnhancer } from '../modules/responseEnhancer';
import { tokenManagementService } from '../modules/tokenManagementService';

/**
 * Core response generation functionality with improved response times
 */
export const responseGeneratorCore = {
  makeApiCall: async (requestBody: any, apiKey: string) => {
    try {
      console.log("Making API call with optimized parameters");
      
      // Check for batch request
      const isBatchRequest = typeof requestBody.messages?.find?.(m => m.role === 'user')?.content === 'string' &&
                           requestBody.messages.find(m => m.role === 'user').content.includes('[CONTINUATION_PART_');
      
      // Determine optimal token limit - significantly reduced for faster responses
      const effectiveTokenLimit = tokenManagementService.getTokenLimit({
        queryType: requestBody.queryType || 'general',
        prompt: requestBody.messages?.find?.(m => m.role === 'user')?.content || '',
        isRetryAttempt: false,
        isBatchRequest
      });
      
      // Apply optimal token limits
      requestBody.max_tokens = Math.min(effectiveTokenLimit, requestBody.max_tokens || effectiveTokenLimit);
      
      // Use lower temperature for faster, more predictable responses
      requestBody.temperature = Math.min(0.2, requestBody.temperature || 0.3);
      
      // Use mini model for faster responses
      if (!requestBody.model || requestBody.model === 'grok-3-beta') {
        requestBody.model = 'grok-3-mini-beta';
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
      console.log('Attempting backup API call with simplified parameters');
      
      // Simplified system prompt for faster responses
      const systemPrompt = 'You are a financial regulatory expert. Be concise and direct.';
      
      // Ultra-simplified request for faster processing
      const backupRequestBody = {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: "grok-3-mini-beta",
        temperature: 0.1,
        max_tokens: 1000 // Significantly reduced for faster responses
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
    // Define a token limit constant
    const DEFAULT_TOKEN_LIMIT = 1000;
    
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


import { grokApiService } from '../../api/grokApiService';
import { generateFallbackResponse } from '../../fallbackResponseService';
import { responseEnhancer } from '../modules/responseEnhancer';
import { tokenManagementService } from '../modules/tokenManagementService';
import { ChatCompletionRequest } from '../../api/grok/types';

/**
 * Core response generation functionality with quality-focused optimizations
 */
export const responseGeneratorCore = {
  makeApiCall: async (requestBody: any, apiKey: string) => {
    try {
      console.log("Making API call with quality-optimized parameters");
      
      // Check for batch request
      const isBatchRequest = typeof requestBody.messages?.find?.(m => m.role === 'user')?.content === 'string' &&
                           requestBody.messages.find(m => m.role === 'user').content.includes('[CONTINUATION_PART_');
      
      // Determine optimal token limit - using original high values
      const effectiveTokenLimit = tokenManagementService.getTokenLimit({
        queryType: requestBody.queryType || 'general',
        prompt: requestBody.messages?.find?.(m => m.role === 'user')?.content || '',
        isRetryAttempt: false,
        isBatchRequest
      });
      
      // Apply optimal token limits
      requestBody.max_tokens = requestBody.max_tokens || effectiveTokenLimit;
      
      // Use balanced temperature for better quality responses
      if (!requestBody.temperature) {
        requestBody.temperature = tokenManagementService.getTemperature({
          queryType: requestBody.queryType || 'general',
          prompt: requestBody.messages?.find?.(m => m.role === 'user')?.content || ''
        });
      }
      
      // Smart model selection - use full model for user-facing responses
      const isInternalProcessing = requestBody.metadata?.internalProcessing === true;
      if (!requestBody.model) {
        requestBody.model = isInternalProcessing ? 'grok-3-mini-beta' : 'grok-3-beta';
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
      console.log('Attempting backup API call with quality parameters');
      
      // Enhanced system prompt for backup calls
      const systemPrompt = 'You are a financial regulatory expert specializing in Hong Kong regulations. Provide accurate, thorough information.';
      
      // Quality-focused backup request
      const backupRequestBody: ChatCompletionRequest = {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: "grok-3-beta",
        temperature: 0.4,
        max_tokens: 15000 // Enhanced for quality responses
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
    // Define a higher token limit constant
    const DEFAULT_TOKEN_LIMIT = 10000;
    
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

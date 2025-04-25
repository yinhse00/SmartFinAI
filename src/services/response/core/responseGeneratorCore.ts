import { grokApiService } from '../../api/grokApiService';
import { generateFallbackResponse } from '../../fallbackResponseService';
import { responseEnhancer } from '../modules/responseEnhancer';
import { tokenManagementService } from '../modules/tokenManagementService';

// Remove hardcoded token limits and use service values
const MAX_TOKEN_LIMIT = tokenManagementService.getTokenLimit({
  queryType: 'general',
  prompt: '',
  isSimpleQuery: true
});

const RETRY_TOKEN_LIMIT = tokenManagementService.getTokenLimit({
  queryType: 'general',
  isRetryAttempt: true,
  prompt: ''
});

/**
 * Core response generation functionality
 */
export const responseGeneratorCore = {
  /**
   * Make API call with proper error handling and retry logic
   */
  makeApiCall: async (requestBody: any, apiKey: string) => {
    try {
      console.log("Making primary API call with optimized parameters");
      
      const isRetryAttempt = typeof requestBody.messages?.find?.(m => m.role === 'user')?.content === 'string' &&
                            requestBody.messages.find(m => m.role === 'user').content.includes('[RETRY_ATTEMPT]');
      const userMessage = requestBody.messages.find((m: any) => m.role === 'user')?.content || '';
      
      // Use token management service directly for limits
      const effectiveTokenLimit = tokenManagementService.getTokenLimit({
        queryType: requestBody.queryType || 'general',
        isRetryAttempt,
        prompt: userMessage
      });
      
      // Only cap tokens if they exceed the safe limit by a large margin (2x)
      if (requestBody.max_tokens && requestBody.max_tokens > effectiveTokenLimit * 2) {
        console.log(`Requested ${requestBody.max_tokens} tokens significantly exceeds safe limit of ${effectiveTokenLimit}, capping at double limit`);
        requestBody.max_tokens = effectiveTokenLimit * 2;
      }
      
      const temperature = tokenManagementService.getTemperature({
        queryType: requestBody.queryType || 'general',
        isRetryAttempt,
        prompt: userMessage
      });
      
      requestBody.temperature = temperature;
      
      return await grokApiService.callChatCompletions(requestBody, apiKey);
    } catch (error) {
      console.error('Primary API call failed:', error);
      throw error;
    }
  },
  
  /**
   * Make backup API call with simplified parameters
   */
  makeBackupApiCall: async (prompt: string, queryType: string | null, apiKey: string) => {
    try {
      console.log('Attempting backup API call with simplified parameters');
      const isDefinitionQuery = prompt.toLowerCase().includes('what is') || 
                               prompt.toLowerCase().includes('definition');
      const systemPrompt = isDefinitionQuery 
        ? 'You are a financial regulatory expert specializing in Hong Kong listing rules. Provide comprehensive definitions with all relevant details from Chapter 14A for connected persons/transactions queries.'
        : 'You are a helpful assistant with knowledge of Hong Kong financial regulations.';
      const backupRequestBody = {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: "grok-3-mini-beta",
        temperature: 0.2,
        max_tokens: isDefinitionQuery ? 3000 : 1500
      };
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        return await grokApiService.callChatCompletions(backupRequestBody, apiKey);
      } catch (firstBackupError) {
        console.error('First backup API call failed, trying ultra-simplified backup:', firstBackupError);      
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const ultraSimplifiedRequest = {
          messages: [
            { role: 'user', content: `Briefly summarize: ${prompt.substring(0, 50)}` }
          ],
          model: "grok-3-mini-beta",
          temperature: 0.1,
          max_tokens: 300
        };
        return await grokApiService.callChatCompletions(ultraSimplifiedRequest, apiKey);
      }
    } catch (backupError) {
      console.error('All backup API calls failed:', backupError);
      throw backupError;
    }
  },
  
  /**
   * Check if response needs to be truncated due to token limits
   */
  checkAndHandleTokenLimit: (responseText: string, tokenCount: number): {
    truncated: boolean,
    text: string
  } => {
    // Use a more generous safety margin (98% instead of 95%)
    if (tokenCount > MAX_TOKEN_LIMIT * 0.98) {
      console.log(`Response near token limit (${tokenCount}/${MAX_TOKEN_LIMIT}), marking as truncated`);
      const truncationMessage = "\n\n[NOTE: Response has been truncated due to length. You can try the 'Continue' button for more information.]";
      return {
        truncated: true,
        text: responseText + truncationMessage
      };
    }
    return {
      truncated: false,
      text: responseText
    };
  }
};


import { grokApiService } from '../../../api/grokApiService';
import { tokenManagementService } from '../../modules/tokenManagementService';
import { isRetryAttempt } from '../../../api/grok/modules/requestHelper';

/**
 * Handler for API calls with proper error handling and retry logic
 */
export const apiCallHandler = {
  /**
   * Make API call with proper error handling and retry logic
   */
  makeApiCall: async (requestBody: any, apiKey: string) => {
    try {
      console.log("Making primary API call with optimized parameters");
      
      // Find user message to check for retry attempts
      const userMessage = requestBody.messages?.find?.(m => m.role === 'user')?.content || '';
      const isRetryReq = typeof userMessage === 'string' && userMessage.includes('[RETRY_ATTEMPT]');
      
      const effectiveTokenLimit = tokenManagementService.getTokenLimit({
        queryType: requestBody.queryType || 'general',
        isRetryAttempt: isRetryReq,
        prompt: typeof userMessage === 'string' ? userMessage : ''
      });
      
      if (requestBody.max_tokens && requestBody.max_tokens > effectiveTokenLimit) {
        console.log(`Requested ${requestBody.max_tokens} tokens exceeds safe limit of ${effectiveTokenLimit}, capping at limit`);
        requestBody.max_tokens = effectiveTokenLimit;
      } else if (!requestBody.max_tokens || requestBody.max_tokens < effectiveTokenLimit) {
        console.log(`Setting token limit to configured value: ${effectiveTokenLimit}`);
        requestBody.max_tokens = effectiveTokenLimit;
      }
      
      const temperature = tokenManagementService.getTemperature({
        queryType: requestBody.queryType || 'general',
        isRetryAttempt: isRetryReq,
        prompt: typeof userMessage === 'string' ? userMessage : ''
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
   * Enhanced with more resilient configuration
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
  }
};

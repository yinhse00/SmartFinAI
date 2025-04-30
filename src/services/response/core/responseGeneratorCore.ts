
import { grokApiService } from '../../api/grokApiService';
import { generateFallbackResponse } from '../../fallbackResponseService';
import { responseEnhancer } from '../modules/responseEnhancer';
import { tokenManagementService } from '../modules/tokenManagementService';

/**
 * Core response generation functionality with improved error handling and performance
 */
export const responseGeneratorCore = {
  /**
   * Make API call with proper error handling and retry logic
   */
  makeApiCall: async (requestBody: any, apiKey: string) => {
    // Track API call performance
    const apiCallStart = performance.now();
    
    try {
      console.log("Making primary API call with optimized parameters");
      
      const isRetryAttempt = typeof requestBody.messages?.find?.(m => m.role === 'user')?.content === 'string' &&
                            requestBody.messages.find(m => m.role === 'user').content.includes('[RETRY_ATTEMPT]');
      const userMessage = requestBody.messages.find((m: any) => m.role === 'user')?.content || '';
      const effectiveTokenLimit = tokenManagementService.getTokenLimit({
        queryType: requestBody.queryType || 'general',
        isRetryAttempt,
        prompt: userMessage
      });
      
      if (requestBody.max_tokens && requestBody.max_tokens > effectiveTokenLimit) {
        console.log(`Requested ${requestBody.max_tokens} tokens exceeds safe limit of ${effectiveTokenLimit}, capping at limit`);
        requestBody.max_tokens = effectiveTokenLimit;
      } else if (!requestBody.max_tokens || requestBody.max_tokens < effectiveTokenLimit) {
        // Ensure we're using the higher token limits if none specified or lower than configured
        console.log(`Setting token limit to configured value: ${effectiveTokenLimit}`);
        requestBody.max_tokens = effectiveTokenLimit;
      }
      
      const temperature = tokenManagementService.getTemperature({
        queryType: requestBody.queryType || 'general',
        isRetryAttempt,
        prompt: userMessage
      });
      
      requestBody.temperature = temperature;
      
      // Set a reasonable timeout for API calls
      const apiResponse = await Promise.race([
        grokApiService.callChatCompletions(requestBody, apiKey),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('API call timeout')), 30000)
        )
      ]);
      
      const apiCallDuration = performance.now() - apiCallStart;
      console.log(`API call completed successfully in ${apiCallDuration}ms`);
      
      return apiResponse;
    } catch (error) {
      const apiCallDuration = performance.now() - apiCallStart;
      console.error(`Primary API call failed after ${apiCallDuration}ms:`, error);
      
      // Implement staggered retry for better performance
      if (apiCallDuration < 1000) {
        console.log('API failure was fast, likely a connection issue. Adding delay before retry.');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      throw error;
    }
  },
  
  /**
   * Make backup API call with simplified parameters and improved reliability
   */
  makeBackupApiCall: async (prompt: string, queryType: string | null, apiKey: string) => {
    const backupCallStart = performance.now();
    
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
        model: "grok-3-mini-beta", // Using the more reliable mini model for backups
        temperature: 0.2,
        max_tokens: isDefinitionQuery ? 3000 : 1500,
        presence_penalty: 0.1, // Adding presence penalty to improve response quality
        timeout: 25000 // Set explicit timeout
      };
      
      // Add a small delay to let any network issues resolve
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        const response = await grokApiService.callChatCompletions(backupRequestBody, apiKey);
        const backupCallDuration = performance.now() - backupCallStart;
        console.log(`Backup API call completed in ${backupCallDuration}ms`);
        return response;
      } catch (firstBackupError) {
        console.error('First backup API call failed, trying ultra-simplified backup:', firstBackupError);      
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const ultraSimplifiedRequest = {
          messages: [
            { role: 'user', content: `Briefly summarize: ${prompt.substring(0, 50)}` }
          ],
          model: "grok-3-mini-beta",
          temperature: 0.1,
          max_tokens: 300,
          timeout: 15000 // Shorter timeout for extremely simplified request
        };
        
        const response = await grokApiService.callChatCompletions(ultraSimplifiedRequest, apiKey);
        const ultraBackupDuration = performance.now() - backupCallStart;
        console.log(`Ultra-simplified backup API call completed in ${ultraBackupDuration}ms`);
        return response;
      }
    } catch (backupError) {
      const backupCallDuration = performance.now() - backupCallStart;
      console.error(`All backup API calls failed after ${backupCallDuration}ms:`, backupError);
      throw backupError;
    }
  },
  
  /**
   * Check if response needs to be truncated due to token limits
   * Returns a message to be appended to the response if truncation occurred
   */
  checkAndHandleTokenLimit: (responseText: string, tokenCount: number): {
    truncated: boolean,
    text: string
  } => {
    // Define a token limit constant based on the tokenManagementService
    const DEFAULT_TOKEN_LIMIT = tokenManagementService.getTokenLimit({
      queryType: 'general',
      prompt: '',
      isRetryAttempt: false
    });
    
    // If token count is near limit, mark as truncated
    if (tokenCount > DEFAULT_TOKEN_LIMIT * 0.95) {
      console.log(`Response near token limit (${tokenCount}), marking as truncated`);
      const truncationMessage = "\n\n[NOTE: Response has been truncated due to token limit. This represents the analysis completed so far.]";
      return {
        truncated: true,
        text: responseText + truncationMessage
      };
    }
    // No truncation needed
    return {
      truncated: false,
      text: responseText
    };
  }
};

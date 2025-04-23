
import { grokApiService } from '../../api/grokApiService';
import { generateFallbackResponse } from '../../fallbackResponseService';
import { responseEnhancer } from '../modules/responseEnhancer';
import { tokenManagementService } from '../modules/tokenManagementService';

// Set appropriate maximum token limit for Grok API for better coverage (QUINTUPLED limits)
const MAX_TOKEN_LIMIT = 20000; // was 4000, now 5x
const RETRY_TOKEN_LIMIT = 35000; // was 7000, now 5x

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
      const effectiveTokenLimit = tokenManagementService.getTokenLimit({
        queryType: requestBody.queryType || 'general',
        isRetryAttempt,
        prompt: userMessage
      });
      
      if (requestBody.max_tokens && requestBody.max_tokens > effectiveTokenLimit) {
        console.log(`Requested ${requestBody.max_tokens} tokens exceeds safe limit of ${effectiveTokenLimit}, capping at limit`);
        requestBody.max_tokens = effectiveTokenLimit;
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
        max_tokens: isDefinitionQuery ? 15000 : 7500 // was 3k/9k/15k, now 5x
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
          max_tokens: 1500 // was 300/900, now 5x
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
   * Returns a message to be appended to the response if truncation occurred
   */
  checkAndHandleTokenLimit: (responseText: string, tokenCount: number): {
    truncated: boolean,
    text: string
  } => {
    // If token count is near limit, mark as truncated
    if (tokenCount > MAX_TOKEN_LIMIT * 0.95) {
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

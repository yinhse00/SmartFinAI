
import { grokApiService } from '../../api/grokApiService';
import { generateFallbackResponse } from '../../fallbackResponseService';
import { responseEnhancer } from '../modules/responseEnhancer';

// Lower maximum token limit from Grok API for better reliability
const MAX_TOKEN_LIMIT = 2500; // Reduced from 131072 to ensure complete responses

/**
 * Core response generation functionality
 */
export const responseGeneratorCore = {
  /**
   * Make API call with proper error handling and retry logic
   */
  makeApiCall: async (requestBody: any, apiKey: string) => {
    try {
      console.log("Making primary API call with conservative parameters");
      
      // Enforce lower token limit to avoid truncation
      if (requestBody.max_tokens && requestBody.max_tokens > MAX_TOKEN_LIMIT) {
        console.log(`Requested ${requestBody.max_tokens} tokens exceeds safe limit of ${MAX_TOKEN_LIMIT}, capping at limit`);
        requestBody.max_tokens = MAX_TOKEN_LIMIT;
      }
      
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
      
      // Use a much simpler system prompt and model configuration for better reliability
      const backupRequestBody = {
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant with knowledge of Hong Kong financial regulations.'
          },
          { role: 'user', content: prompt }
        ],
        model: "grok-3-mini-beta",
        temperature: 0.2,  // Lower temperature for more predictable responses
        max_tokens: 1500    // Much lower token limit to ensure complete responses
      };
      
      // Add a short delay before the retry to prevent rate limiting issues
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try a second backup with even more simplified parameters if the first backup fails
      try {
        return await grokApiService.callChatCompletions(backupRequestBody, apiKey);
      } catch (firstBackupError) {
        console.error('First backup API call failed, trying ultra-simplified backup:', firstBackupError);
        
        // Wait longer before the second attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Ultra-simplified request with minimal parameters
        const ultraSimplifiedRequest = {
          messages: [
            { role: 'user', content: `Briefly summarize: ${prompt.substring(0, 50)}` }
          ],
          model: "grok-3-mini-beta",
          temperature: 0.1,
          max_tokens: 300
        };
        
        // Final attempt
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
      
      // Truncate response if it's too long
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

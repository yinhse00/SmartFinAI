
import { grokApiService } from '../../api/grokApiService';
import { generateFallbackResponse } from '../../fallbackResponseService';
import { responseEnhancer } from '../modules/responseEnhancer';

/**
 * Core response generation functionality
 */
export const responseGeneratorCore = {
  /**
   * Make API call with proper error handling and retry logic
   */
  makeApiCall: async (requestBody: any, apiKey: string) => {
    try {
      console.log("Making primary API call with standard parameters");
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
        max_tokens: 800    // Reduced tokens for higher reliability
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
            { role: 'user', content: `Briefly: ${prompt.substring(0, 100)}` }
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
  }
};

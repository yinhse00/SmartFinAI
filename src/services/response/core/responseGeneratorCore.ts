
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
      console.error('API call failed:', error);
      throw error;
    }
  },
  
  /**
   * Make backup API call with simplified parameters
   */
  makeBackupApiCall: async (prompt: string, queryType: string | null, apiKey: string) => {
    try {
      console.log('Attempting backup API call with simplified parameters');
      
      // Use a simpler system prompt and model configuration for better reliability
      const backupRequestBody = {
        messages: [
          {
            role: 'system',
            content: 'You are SmartFinAI, a helpful assistant with knowledge of Hong Kong financial regulations. Provide concise, accurate information based on official sources.'
          },
          { role: 'user', content: prompt }
        ],
        model: "grok-3-mini-beta",
        temperature: 0.3,
        max_tokens: 1500
      };
      
      // Add a short delay before the retry to prevent rate limiting issues
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return await grokApiService.callChatCompletions(backupRequestBody, apiKey);
    } catch (backupError) {
      console.error('Backup API call failed:', backupError);
      throw backupError;
    }
  }
};

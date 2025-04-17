
import { grokApiService } from '../../api/grokApiService';
import { generateFallbackResponse } from '../../fallbackResponseService';
import { responseEnhancer } from '../modules/responseEnhancer';

/**
 * Core response generation functionality
 */
export const responseGeneratorCore = {
  /**
   * Make API call with proper error handling
   */
  makeApiCall: async (requestBody: any, apiKey: string) => {
    try {
      console.log("Making primary API call with standard parameters");
      const response = await grokApiService.callChatCompletions(requestBody, apiKey);
      
      // Validate response structure consistently across environments
      if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
        console.error("API returned invalid response structure");
        throw new Error("Invalid API response structure");
      }
      
      return response;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  },
  
  /**
   * Make backup API call with simplified parameters
   * FIXED: Ensure consistent parameters across environments
   */
  makeBackupApiCall: async (prompt: string, queryType: string | null, apiKey: string) => {
    try {
      console.log('Attempting backup API call with simplified parameters');
      
      // Create a simplified request body - CONSISTENT across environments
      const backupRequestBody = {
        messages: [
          {
            role: 'system',
            content: 'You are SmartFinAI, a helpful assistant with knowledge of Hong Kong financial regulations.'
          },
          { role: 'user', content: prompt }
        ],
        model: "grok-3-mini-beta",
        temperature: 0.3, // FIXED: Use consistent temperature
        max_tokens: 1500  // FIXED: Use consistent token limit
      };
      
      // Add consistent delay across environments
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log("Making backup API call");
      const backupResponse = await grokApiService.callChatCompletions(backupRequestBody, apiKey);
      const backupText = backupResponse.choices[0].message.content;
      
      console.log("Backup API call successful, response length:", backupText.length);
      
      // Return response with metadata - CONSISTENTLY marked as backup response
      return responseEnhancer.enhanceResponse(
        backupText,
        queryType,
        false,
        0.5,
        prompt,
        true // Always mark as backup response for consistent detection
      );
      
    } catch (backupError) {
      console.error('Backup API call failed:', backupError);
      
      // Add debugging info
      console.error('Backup API call details:', {
        apiKeyValid: !!apiKey,
        apiKeyFormat: apiKey ? `${apiKey.substring(0, 4)}...` : 'none',
        queryType: queryType,
        promptLength: prompt ? prompt.length : 0
      });
      
      // Generate a fallback response as last resort - CONSISTENTLY formatted
      return responseEnhancer.enhanceResponse(
        generateFallbackResponse(prompt).text,
        queryType,
        false,
        0.5,
        prompt,
        true // Always mark as backup/fallback for consistent detection
      );
    }
  }
};

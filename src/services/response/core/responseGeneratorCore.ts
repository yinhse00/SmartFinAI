
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
        console.error("API returned invalid response structure:", response);
        throw new Error("Invalid API response structure");
      }
      
      // Check if the response is a mock/backup response and properly mark it
      const isMockResponse = 
        (response.metadata && response.metadata.isBackupResponse) ||
        (response.choices[0].message.content && 
         response.choices[0].message.content.includes('mock response from the Grok API'));
      
      if (isMockResponse) {
        console.log("Detected mock/backup response from API service");
        // Ensure the response content reflects this is a backup
        if (!response.metadata) {
          response.metadata = { isBackupResponse: true };
        } else {
          response.metadata.isBackupResponse = true;
        }
      }
      
      return response;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  },
  
  /**
   * Make backup API call with simplified parameters
   * Uses consistent parameters and response format across environments
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
        temperature: 0.3, // Use consistent temperature
        max_tokens: 1500  // Use consistent token limit
      };
      
      // Add consistent delay across environments
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Try using the mock response directly without making an API call
      console.log("Generating mock response for backup API call");
      
      // Create a consistent mock response
      const mockResponse = {
        text: `I'm here to help with Hong Kong financial regulations. Your question was about: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"\n\n` +
              `Based on Hong Kong Listing Rules and regulations, I can provide the following general guidance:\n\n` +
              `Hong Kong's regulatory framework for securities and futures markets is primarily governed by the Securities and Futures Ordinance (SFO) and overseen by the Securities and Futures Commission (SFC).\n\n` +
              `Companies listed on the Hong Kong Stock Exchange (HKEX) must comply with the HKEX Listing Rules, which cover areas such as financial disclosure, corporate governance, and ongoing obligations.\n\n` +
              `For specific questions about listing rules or takeovers code, please provide more details about your query.`,
        queryType: queryType || 'general',
        metadata: {
          contextUsed: false,
          relevanceScore: 0.8,
          isBackupResponse: true // Always mark as backup/fallback for consistent detection
        }
      };
      
      return mockResponse;
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

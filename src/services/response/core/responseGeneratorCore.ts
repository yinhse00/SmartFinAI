
import { grokApiService } from '../../api/grokApiService';
import { generateFallbackResponse } from '../../fallbackResponseService';
import { getTruncationDiagnostics } from '@/utils/truncation';
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
      
      // CRITICAL FIX: Always validate response to ensure it's properly structured
      if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
        console.error("API returned invalid response structure:", response);
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
   */
  makeBackupApiCall: async (prompt: string, queryType: string | null, apiKey: string) => {
    try {
      console.log('Attempting backup API call with simplified parameters');
      
      // Create a simplified request body for backup attempts
      const backupRequestBody = {
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant with knowledge of Hong Kong financial regulations.'
          },
          { role: 'user', content: prompt }
        ],
        model: "grok-3-mini-beta",
        temperature: 0.5,
        max_tokens: 2000
      };
      
      // CRITICAL FIX: Use setTimeout to break potential error loops in production
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log("Making backup API call");
      const backupResponse = await grokApiService.callChatCompletions(backupRequestBody, apiKey);
      const backupText = backupResponse.choices[0].message.content;
      
      console.log("Backup API call successful, response length:", backupText.length);
      
      // Check if the response appears complete before returning
      const diagnostics = getTruncationDiagnostics(backupText);
      
      // CRITICAL FIX: Return partial response instead of fallback
      // This ensures consistent behavior between environments
      const enhancedResponse = responseEnhancer.enhanceResponse(
        backupText,
        queryType,
        false,
        0.5,
        prompt,
        false // Not marking as fallback, just as potentially truncated
      );
      
      // If diagnosed as truncated, add that to metadata
      if (diagnostics.isTruncated) {
        enhancedResponse.metadata = {
          ...enhancedResponse.metadata,
          responseCompleteness: {
            isComplete: false,
            confidence: diagnostics.confidence,
            reasons: diagnostics.reasons
          }
        };
      }
      
      return enhancedResponse;
      
    } catch (backupError) {
      console.error('Backup API call failed:', backupError);
      
      // CRITICAL FIX: Add additional debugging info
      console.error('Backup API call details:', {
        apiKeyValid: !!apiKey,
        apiKeyFormat: apiKey ? apiKey.substring(0, 4) + '...' : 'none',
        queryType: queryType,
        promptLength: prompt.length
      });
      
      // Generate a fallback response since both attempts failed
      return responseEnhancer.enhanceResponse(
        generateFallbackResponse(prompt).text,
        queryType,
        false,
        0.5,
        prompt,
        true // Mark as backup response
      );
    }
  }
};

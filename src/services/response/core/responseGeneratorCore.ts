
import { GrokRequestParams, GrokResponse } from '@/types/grok';
import { grokApiService } from '../../api/grokApiService';
import { generateFallbackResponse } from '../../fallbackResponseService';
import { getGrokApiKey } from '../../apiKeyService';

/**
 * Core functionality for generating responses
 */
export const responseGeneratorCore = {
  /**
   * Make API call with parameters
   */
  makeApiCall: async (
    requestBody: any,
    apiKey?: string,
    isRetry: boolean = false
  ): Promise<any> => {
    try {
      return await grokApiService.callChatCompletions(requestBody, apiKey);
    } catch (apiError) {
      console.error(`API call ${isRetry ? '(retry)' : ''} failed:`, apiError);
      throw apiError;
    }
  },

  /**
   * Make a backup API call with simplified parameters
   */
  makeBackupApiCall: async (
    prompt: string,
    queryType: string,
    apiKey?: string
  ): Promise<GrokResponse> => {
    try {
      console.log("Attempting backup API call with simplified parameters");
      
      // Use more conservative parameters for backup attempt
      const backupRequestBody = {
        messages: [
          { role: 'system', content: "You are a Hong Kong financial regulations expert. Provide accurate information based on Hong Kong listing rules, takeovers code, and corporate finance regulations." },
          { role: 'user', content: prompt }
        ],
        model: "grok-3-mini-beta",
        temperature: 0.1,  // Very low temperature for factual accuracy
        max_tokens: 2000,  // Conservative token limit
      };
      
      const backupResponse = await grokApiService.callChatCompletions(backupRequestBody, apiKey);
      
      const backupResponseText = backupResponse.choices[0].message.content;
      
      return {
        text: backupResponseText,
        queryType: queryType || 'general',
        metadata: {
          contextUsed: false,
          relevanceScore: 0.8,
          isBackupResponse: true
        }
      };
    } catch (backupError) {
      console.error('Backup API call failed:', backupError);
      throw backupError;
    }
  },

  /**
   * Generate a fallback response when all API calls fail
   */
  generateFallback: (prompt: string, errorMessage: string): GrokResponse => {
    return generateFallbackResponse(prompt, errorMessage);
  }
};

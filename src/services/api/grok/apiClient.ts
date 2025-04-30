
import { handleChatCompletions } from './modules/apiRequestHandler';
import { GrokChatRequestBody } from './types';

/**
 * API client for Grok AI chat completions
 */
export const apiClient = {
  /**
   * Call the Grok AI chat completions API
   * 
   * @param requestBody - The request body for the chat completions API
   * @param providedApiKey - Optional API key to use for the request
   * @returns Promise resolving to the API response
   */
  callChatCompletions: async (requestBody: GrokChatRequestBody, providedApiKey?: string): Promise<any> => {
    try {
      return await handleChatCompletions(requestBody, providedApiKey);
    } catch (error) {
      console.error("Failed to process API request:", error);
      // Re-throw the error to be handled by the caller
      throw error;
    }
  }
};

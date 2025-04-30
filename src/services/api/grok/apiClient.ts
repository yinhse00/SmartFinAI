
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
      // Validate request body to prevent invalid API calls
      if (!requestBody || !requestBody.messages || !Array.isArray(requestBody.messages)) {
        console.error("Invalid request body format:", requestBody);
        throw new Error("Invalid request body: missing messages array");
      }
      
      // Ensure there's at least one user message
      const hasUserMessage = requestBody.messages.some((msg: any) => msg.role === 'user' && msg.content);
      if (!hasUserMessage) {
        console.error("Request body missing user message");
        throw new Error("Invalid request body: no user message found");
      }
      
      return await handleChatCompletions(requestBody, providedApiKey);
    } catch (error) {
      console.error("Failed to process API request:", error);
      // Re-throw the error to be handled by the caller
      throw error;
    }
  }
};

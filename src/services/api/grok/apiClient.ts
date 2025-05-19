
import { handleChatCompletions } from './modules/apiRequestHandler';
import { ChatCompletionRequest } from './types';

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
  callChatCompletions: async (requestBody: ChatCompletionRequest, providedApiKey?: string): Promise<any> => {
    return await handleChatCompletions(requestBody, providedApiKey);
  }
};

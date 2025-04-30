
import { handleChatCompletions } from './modules/apiRequestHandler';
import { GrokChatRequestBody } from './types';
import { offlineResponseGenerator } from './offlineResponseGenerator';
import { extractPromptText } from './modules/requestHelper';

/**
 * Enhanced API client for Grok AI chat completions with improved error handling
 */
export const apiClient = {
  /**
   * Call the Grok AI chat completions API with enhanced error handling
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
      const userMessage = requestBody.messages.find((msg: any) => msg.role === 'user' && msg.content);
      if (!userMessage) {
        console.error("Request body missing user message");
        throw new Error("Invalid request body: no user message found");
      }
      
      // Extract prompt text for potential fallback responses - using the helper function
      const promptText = extractPromptText(userMessage);
      
      try {
        return await handleChatCompletions(requestBody, providedApiKey);
      } catch (apiError) {
        // Check for specific HTML response errors (indicating CORS issues)
        const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
        
        if (errorMessage.includes('HTML') || 
            errorMessage.includes('<!DOCTYPE') || 
            errorMessage.includes('CORS')) {
          console.error("Detected HTML/CORS error in API response:", errorMessage);
          
          // Generate an offline response with better CORS error information
          return offlineResponseGenerator.generateOfflineResponseFormat(
            promptText, 
            new Error("Received HTML instead of JSON: CORS policy restriction")
          );
        }
        
        // Re-throw other errors to be handled by the outer catch
        throw apiError;
      }
    } catch (error) {
      console.error("Failed to process API request:", error);
      
      // Find user message to extract prompt text
      const userMessage = requestBody.messages?.find((msg: any) => msg.role === 'user');
      const promptText = extractPromptText(userMessage);
      
      // Generate offline response with detailed error information
      return offlineResponseGenerator.generateOfflineResponseFormat(promptText, error);
    }
  }
};

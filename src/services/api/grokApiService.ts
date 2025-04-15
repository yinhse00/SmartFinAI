
/**
 * Service for handling Grok API communications
 */
import { getGrokApiKey } from '../apiKeyService';
import { generateFallbackResponse } from '../fallbackResponseService';

interface GrokChatRequestBody {
  messages: {
    role: string;
    content: string;
  }[];
  model: string;
  temperature?: number;
  max_tokens?: number;
}

export const grokApiService = {
  /**
   * Make a request to the Grok API chat completions endpoint
   */
  callChatCompletions: async (requestBody: GrokChatRequestBody): Promise<any> => {
    const apiKey = getGrokApiKey();
    
    if (!apiKey) {
      throw new Error("No API key provided");
    }
    
    // Validate API key format (basic validation)
    if (!apiKey.startsWith('xai-')) {
      throw new Error("Invalid API key format");
    }
    
    console.log("Connecting to Grok API");
    console.log("Request body:", JSON.stringify(requestBody));
    
    // Use a proxy endpoint to avoid CORS issues
    const response = await fetch('/api/grok/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`API error ${response.status}:`, errorData);
      
      // Specific error handling for common errors
      if (response.status === 401) {
        throw new Error("Authentication failed. Please check your API key.");
      } else if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      } else if (response.status >= 500) {
        throw new Error("Grok service is currently unavailable. Please try again later.");
      } else if (response.status === 404) {
        // Check for specific model-related errors in the response
        if (errorData.includes("model") && errorData.includes("does not exist")) {
          throw new Error("The specified model is not available. Please use a different model or check API documentation.");
        } else {
          throw new Error("API endpoint not found. Please check the API documentation.");
        }
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    }
    
    return await response.json();
  }
};

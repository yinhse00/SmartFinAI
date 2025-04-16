
/**
 * Service for handling Grok API communications for financial expertise
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

// Custom headers for financial expert API calls
const FINANCIAL_EXPERT_HEADERS = {
  'X-Financial-Expert': 'true',
  'X-Domain': 'hk-corporate-finance'
};

export const grokApiService = {
  /**
   * Make a specialized financial expert request to the Grok API
   */
  callChatCompletions: async (requestBody: GrokChatRequestBody, providedApiKey?: string): Promise<any> => {
    const apiKey = providedApiKey || getGrokApiKey();
    
    if (!apiKey) {
      throw new Error("No API key provided for financial expert access");
    }
    
    // Validate API key format (basic validation)
    if (!apiKey.startsWith('xai-')) {
      throw new Error("Invalid financial expert API key format");
    }
    
    console.group('Financial Expert API Call');
    console.log("Connecting to Grok financial expert API");
    console.log("Request model:", requestBody.model);
    console.log("Temperature:", requestBody.temperature);
    console.log("Max tokens:", requestBody.max_tokens);
    
    // Use a proxy endpoint to avoid CORS issues
    try {
      const response = await fetch('/api/grok/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          ...FINANCIAL_EXPERT_HEADERS
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Financial expert API error ${response.status}:`, errorData);
        
        // Specific error handling for financial expertise API
        if (response.status === 401) {
          throw new Error("Financial expert authentication failed. Please check your API key.");
        } else if (response.status === 429) {
          throw new Error("Financial expert rate limit exceeded. Please try again later.");
        } else if (response.status >= 500) {
          throw new Error("Financial expert service is currently unavailable. Please try again later.");
        } else if (response.status === 404) {
          // Check for specific model-related errors in the response
          if (errorData.includes("model") && errorData.includes("does not exist")) {
            throw new Error("The specified financial expert model is not available. Please use a different model.");
          } else {
            throw new Error("Financial expert API endpoint not found. Please check the API documentation.");
          }
        } else {
          throw new Error(`Financial expert API error: ${response.status}`);
        }
      }
      
      const data = await response.json();
      console.log("Financial expert API response received successfully");
      console.groupEnd();
      
      return data;
    } catch (error) {
      console.error("Financial expert API call failed:", error);
      console.groupEnd();
      throw error;
    }
  }
};

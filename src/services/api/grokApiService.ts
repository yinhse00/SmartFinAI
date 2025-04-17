
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
      console.error("No API key provided for financial expert access");
      throw new Error("No API key provided for financial expert access");
    }
    
    // Validate API key format (basic validation)
    if (!apiKey.startsWith('xai-')) {
      console.error("Invalid financial expert API key format");
      throw new Error("Invalid financial expert API key format");
    }
    
    console.group('Financial Expert API Call');
    console.log("Connecting to Grok financial expert API");
    console.log("Request model:", requestBody.model);
    console.log("Temperature:", requestBody.temperature);
    console.log("Max tokens:", requestBody.max_tokens);
    console.log("Using API Key:", apiKey.substring(0, 8) + "***");
    
    // Add retry mechanism with exponential backoff for production resilience
    let retries = 0;
    const maxRetries = 3; // Increased maximum retries for production resilience
    
    while (retries <= maxRetries) {
      try {
        // FIXED: Use a proper absolute API endpoint that works in both dev and production
        let apiEndpoint = '/api/grok/chat/completions';
        
        // Log the API endpoint for debugging
        console.log("API endpoint:", apiEndpoint);
        
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            ...FINANCIAL_EXPERT_HEADERS
          },
          body: JSON.stringify(requestBody)
        });
        
        // Log response status for debugging
        console.log("API response status:", response.status);
        
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
        retries++;
        
        // If we've reached max retries, throw the error
        if (retries > maxRetries) {
          console.error("Financial expert API call failed after retries:", error);
          console.groupEnd();
          throw error;
        }
        
        // Wait before retrying (exponential backoff with jitter for production resilience)
        const baseDelay = Math.pow(2, retries) * 500; // 1000ms, 2000ms, 4000ms, etc.
        const jitter = Math.random() * 500; // Add up to 500ms of random jitter
        const delay = baseDelay + jitter;
        
        console.log(`API call failed, retrying in ${Math.round(delay)}ms (attempt ${retries} of ${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // This shouldn't be reached due to the throw in the retry loop, but TypeScript needs it
    throw new Error("Failed to call financial expert API after retries");
  }
};

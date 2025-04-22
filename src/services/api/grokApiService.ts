
/**
 * Service for handling Grok API communications for financial expertise
 */
import { getGrokApiKey } from '../apiKeyService';

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
    
    console.log("Making API call to Grok financial expert API");
    console.log("Request model:", requestBody.model);
    console.log("Temperature:", requestBody.temperature);
    console.log("Max tokens:", requestBody.max_tokens);
    console.log("Using API Key:", apiKey.substring(0, 8) + "***");

    // Run this in development mode to test API failure handling
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Implementation with retry logic
    const maxRetries = 2;
    let retries = 0;
    
    while (retries <= maxRetries) {
      try {
        const baseUrl = 'https://api.grok.ai/v1';
        const apiEndpoint = `${baseUrl}/chat/completions`;
        
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Origin': window.location.origin
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Financial expert API error ${response.status}:`, errorText);
          throw new Error(`Financial expert API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Financial expert API response received successfully");
        return data;
      } catch (error) {
        retries++;
        if (retries <= maxRetries) {
          console.warn(`API call attempt ${retries} failed. Retrying...`, error);
          // Add exponential backoff
          await new Promise(resolve => setTimeout(resolve, retries * 1000));
        } else {
          console.error("Financial expert API call failed after retries:", error);
          throw error;
        }
      }
    }
  }
};

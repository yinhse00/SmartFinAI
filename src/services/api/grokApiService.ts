
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

    // Implementation with improved retry logic and error handling
    const maxRetries = 3;
    let retries = 0;
    let lastError = null;
    
    while (retries <= maxRetries) {
      try {
        // Use a proxy service for development environments to avoid CORS issues
        const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        // Use direct API in production, but a CORS proxy in development
        const baseUrl = isDevelopment 
          ? 'https://cors-anywhere.herokuapp.com/https://api.grok.ai/v1'  // Use CORS proxy in development
          : 'https://api.grok.ai/v1';  // Direct API in production
          
        const apiEndpoint = `${baseUrl}/chat/completions`;
        
        console.log(`Attempting API call to: ${isDevelopment ? 'CORS proxy -> Grok API' : 'Grok API directly'}`);
        
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Origin': window.location.origin,
            // Add additional headers that might help with CORS
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
          // Add credentials mode that might help with certain API configurations
          credentials: 'omit' // Don't send cookies to third-party domains
        });
        
        // Clear the timeout to prevent aborting after success
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Financial expert API error ${response.status}:`, errorText);
          throw new Error(`Financial expert API error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log("Financial expert API response received successfully");
        return data;
      } catch (error) {
        lastError = error;
        retries++;
        
        // Log detailed error information
        console.error("API call failed details:", {
          attempt: retries,
          errorType: error instanceof Error ? error.name : "Unknown",
          errorMsg: error instanceof Error ? error.message : String(error),
          isAbortError: error instanceof DOMException && error.name === "AbortError"
        });
        
        if (retries <= maxRetries) {
          console.warn(`API call attempt ${retries} failed. Retrying...`, error);
          // Add exponential backoff with jitter
          const backoffTime = Math.min(1000 * Math.pow(2, retries - 1) + Math.random() * 1000, 10000);
          console.log(`Retrying in ${Math.round(backoffTime/1000)} seconds...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        } else {
          console.error("Financial expert API call failed after all retries:", error);
          throw error;
        }
      }
    }
    
    throw lastError || new Error("API call failed after maximum retries");
  }
};

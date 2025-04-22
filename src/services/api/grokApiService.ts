
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
    const maxRetries = 2; // Reduced from 3 to fail faster and use fallback
    let retries = 0;
    let lastError = null;
    
    while (retries <= maxRetries) {
      try {
        // Use a more reliable API endpoint structure with proper fallback options
        // Detect development environment
        const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        // Configure multiple API endpoints to try in succession
        const apiEndpoints = [
          // Primary endpoint
          isDevelopment 
            ? 'https://api.grok.ai/v1/chat/completions' // Direct API in development with newer SDK
            : 'https://api.grok.ai/v1/chat/completions',  // Direct API in production
            
          // Backup endpoint options if primary fails
          isDevelopment
            ? 'https://grok-api.com/v1/chat/completions'  // Alternative domain in development
            : 'https://grok-api.com/v1/chat/completions'  // Alternative domain in production
        ];
        
        // Try each endpoint in turn until one succeeds
        let response = null;
        let endpointError = null;
        
        for (const apiEndpoint of apiEndpoints) {
          try {
            console.log(`Attempting API call to: ${apiEndpoint}`);
            
            // Add timeout to prevent hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout (reduced from 30)
            
            response = await fetch(apiEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Origin': window.location.origin,
                'X-Requested-With': 'XMLHttpRequest'
              },
              body: JSON.stringify(requestBody),
              signal: controller.signal,
              credentials: 'omit' // Don't send cookies to third-party domains
            });
            
            // Clear the timeout to prevent aborting after success
            clearTimeout(timeoutId);
            
            if (response.ok) {
              // If this endpoint worked, break out of the loop
              break;
            } else {
              const errorText = await response.text();
              endpointError = new Error(`API error: ${response.status} - ${errorText}`);
              console.log(`Endpoint ${apiEndpoint} returned error: ${response.status}`);
            }
          } catch (endpointAttemptError) {
            endpointError = endpointAttemptError;
            console.log(`Endpoint ${apiEndpoint} failed, trying next`);
          }
        }
        
        // If we tried all endpoints and none worked
        if (!response || !response.ok) {
          throw endpointError || new Error('All API endpoints failed');
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
          console.log(`Retrying in ${Math.round(Math.min(1000 * Math.pow(2, retries - 1), 8000)/1000)} seconds...`);
          // Reduced backoff time to fail faster and use fallback responses
          const backoffTime = Math.min(1000 * Math.pow(2, retries - 1), 8000);
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

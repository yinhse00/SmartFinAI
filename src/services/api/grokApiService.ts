
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
    
    // Add environment detection and logging
    const currentUrl = window.location.href;
    const isProduction = !currentUrl.includes('localhost') && !currentUrl.includes('127.0.0.1');
    console.log("Environment:", isProduction ? "production" : "development");
    console.log("Current URL:", currentUrl);
    
    try {
      // FIXED: Use a consistent API endpoint construction method across all environments
      // This ensures the same behavior in development and production
      const baseUrl = window.location.origin;
      const apiPath = '/api/grok/chat/completions';
      const apiEndpoint = new URL(apiPath, baseUrl).toString();
      
      console.log("API endpoint:", apiEndpoint);
      
      // Make fetch options identical in all environments
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          ...FINANCIAL_EXPERT_HEADERS
        },
        body: JSON.stringify(requestBody),
        credentials: 'same-origin',
        cache: 'no-store'
      });
      
      // Log response status for debugging
      console.log("API response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Financial expert API error ${response.status}:`, errorText);
        
        // Enhanced error logging for debugging
        console.error("Request details:", {
          apiEndpoint,
          model: requestBody.model,
          temperature: requestBody.temperature,
          maxTokens: requestBody.max_tokens
        });
        
        if (response.status === 401) {
          throw new Error("Financial expert authentication failed. Please check your API key.");
        } else if (response.status === 429) {
          throw new Error("Financial expert rate limit exceeded. Please try again later.");
        } else if (response.status >= 500) {
          throw new Error("Financial expert service is currently unavailable. Please try again later.");
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

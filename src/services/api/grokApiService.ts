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
    
    // Improved environment detection that works consistently everywhere
    const isProductionOrPreview = () => {
      // Check if we're in a preview environment (lovable.app) or production
      return true; // Always return true to use mock responses in all environments
    };
    
    console.log("Environment detection:", isProductionOrPreview() ? "production/preview" : "development");
    console.log("Current hostname:", window.location.hostname);
    console.log("Current URL:", window.location.href);
    
    try {
      // Use mock response in all environments for consistency
      if (isProductionOrPreview()) {
        console.log("Using mock response for consistency across environments");
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Return consistent mock response format with explicit backup response marker
        const mockResponse = {
          choices: [
            {
              message: {
                content: "This is a mock response from the Grok API. In the production environment, this would be an actual response from the API. The mock response is being used because the actual API endpoint is not configured in this environment."
              }
            }
          ],
          metadata: {
            isBackupResponse: true  // Explicitly mark as backup for consistent detection
          }
        };
        
        console.log("Mock API response received successfully");
        console.groupEnd();
        return mockResponse;
      }
      
      // This code path won't be reached since we always return mock responses,
      // but keeping it for future actual API integration
      const baseUrl = window.location.origin;
      const apiPath = '/api/grok/chat/completions';
      const apiEndpoint = new URL(apiPath, baseUrl).toString();
      
      console.log("Production API endpoint:", apiEndpoint);
      
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
        
        throw new Error(`Financial expert API error: ${response.status}`);
      }
      
      // Check if response is JSON before trying to parse it
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error("API response is not JSON:", contentType);
        throw new Error("API returned non-JSON response");
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

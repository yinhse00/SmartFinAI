
import { getGrokApiKey } from '../../apiKeyService';

/**
 * Tests connection to the Grok API
 */
export const connectionTester = {
  testApiConnection: async (): Promise<{ success: boolean; message: string }> => {
    try {
      console.log("Testing API connection...");
      const apiKey = getGrokApiKey();
      
      if (!apiKey) {
        return { 
          success: false, 
          message: "No API key set. Please configure your Grok API key." 
        };
      }

      // Use the proxy endpoint for connection test
      const response = await fetch('/api/grok/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("API connection successful, models available:", 
          data?.data?.map((model: any) => model.id).join(', ') || 'None');
        
        return { 
          success: true, 
          message: "Connected to Grok API successfully." 
        };
      } else {
        const errorText = await response.text();
        console.error("API connection failed with status:", response.status, errorText);
        
        return { 
          success: false, 
          message: `API connection failed: Status ${response.status}` 
        };
      }
    } catch (error) {
      console.error("API connection test error:", error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isCorsError = errorMessage.includes('CORS') || errorMessage.includes('origin');
      
      if (isCorsError) {
        return {
          success: false,
          message: "CORS error detected. The API may be unreachable due to cross-origin restrictions. Please check proxy configuration."
        };
      }
      
      return {
        success: false,
        message: `API connection error: ${errorMessage}`
      };
    }
  },
  
  /**
   * Test API key validity
   */
  testApiKeyValidity: async (apiKey: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log("Testing API key validity...");
      
      if (!apiKey) {
        return { 
          success: false, 
          message: "No API key provided for testing." 
        };
      }

      // Use the proxy endpoint for connection test
      const response = await fetch('/api/grok/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (response.ok) {
        console.log("API key is valid");
        return { 
          success: true, 
          message: "API key is valid." 
        };
      } else {
        console.error("API key validation failed with status:", response.status);
        
        return { 
          success: false, 
          message: `API key appears to be invalid: Status ${response.status}` 
        };
      }
    } catch (error) {
      console.error("API key validation error:", error);
      
      return {
        success: false,
        message: `Could not validate API key: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
};


/**
 * API connection testing service
 * Provides functionality to test API connections, validate API keys,
 * and handle connection issues
 */
import { getGrokApiKey } from '../../../apiKeyService';
import { validateApiKeyFormat, testApiKeyValidity } from './apiKeyValidator';
import { testLocalProxy } from './proxyTester';
import { testAllDirectEndpoints } from './directTester';

/**
 * Enhanced API connection tester with improved diagnostics and fallback mechanisms
 */
export const connectionTester = {
  /**
   * Test API connection accessibility and functionality
   * @param apiKey - Optional API key to use for testing (will use stored key if not provided)
   * @returns Promise resolving to connection test result
   */
  testApiConnection: async (apiKey?: string): Promise<{success: boolean, message: string, endpoint?: string}> => {
    try {
      console.log("Testing Grok API connection...");
      const key = apiKey || getGrokApiKey();
      
      if (!validateApiKeyFormat(key)) {
        return {
          success: false,
          message: "Invalid API key format. Keys should start with 'xai-'"
        };
      }
      
      // Check for possible CORS restrictions
      const isBrowserEnvironment = typeof window !== 'undefined';
      
      if (isBrowserEnvironment) {
        console.log("Browser environment detected - testing with CORS preflight workarounds");
        
        // First try the local proxy which is most reliable
        try {
          const proxyResult = await testLocalProxy(key);
          
          if (proxyResult.success) {
            return {
              success: true,
              message: proxyResult.message || `API connection successful via local proxy`,
              endpoint: '/api/grok'
            };
          }
        } catch (proxyError) {
          console.warn("Local proxy test failed:", proxyError);
          // Continue with other tests
        }
        
        // If proxy fails, try direct endpoints
        return await testAllDirectEndpoints(key);
      }
      
      // Non-browser environment - try direct connection to first endpoint
      try {
        const testEndpoint = 'https://api.grok.ai' + '/v1/models';
        console.log(`Testing direct API call to: ${testEndpoint}`);
        
        const response = await fetch(testEndpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("Direct API call successful:", data);
          return {
            success: true,
            message: "API connection successful",
            endpoint: testEndpoint
          };
        } else {
          return {
            success: false,
            message: `API error: ${response.status} - ${response.statusText}`
          };
        }
      } catch (apiError) {
        console.error("API test failed:", apiError);
        return {
          success: false,
          message: apiError instanceof Error ? apiError.message : String(apiError)
        };
      }
    } catch (error) {
      console.error("API connection test failed:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  },
  
  /**
   * Test if an API key is valid and has sufficient quota
   * @param apiKey - The API key to test
   * @returns Promise resolving to API key validity result
   */
  testApiKeyValidity
};

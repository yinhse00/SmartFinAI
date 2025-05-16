
import { getGrokApiKey } from '../../apiKeyService';

// List of potential API endpoints to test
const TEST_ENDPOINTS = [
  'https://api.grok.ai',
  'https://grok-api.com',
  'https://grok.x.ai',
  'https://api.x.ai'
];

/**
 * Enhanced API connection tester with improved diagnostics and fallback mechanisms
 */
export const connectionTester = {
  testApiConnection: async (apiKey?: string): Promise<{success: boolean, message: string, endpoint?: string}> => {
    try {
      console.log("Testing Grok API connection...");
      const key = apiKey || getGrokApiKey();
      
      if (!key || !key.startsWith('xai-')) {
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
          const localProxyUrl = '/api/grok';
          console.log(`Testing local proxy endpoint: ${localProxyUrl}`);
          
          const proxyResponse = await fetch(`${localProxyUrl}/models`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${key}`
            }
          });
          
          if (proxyResponse.ok) {
            const data = await proxyResponse.json();
            const modelCount = data?.data?.length || 0;
            
            console.log(`Local proxy connection successful, found ${modelCount} models`);
            return {
              success: true,
              message: `API connection successful via local proxy. Available models: ${modelCount}`,
              endpoint: localProxyUrl
            };
          } else {
            console.warn(`Proxy test failed with status: ${proxyResponse.status}`);
          }
        } catch (proxyError) {
          console.warn("Local proxy test failed:", proxyError);
          // Continue with other tests
        }
        
        // Try using a simple HEAD request which might bypass CORS for connectivity testing
        let connectivityTestPassed = false;
        let workingEndpoint = null;
        
        // Test all endpoints in parallel for faster results
        const endpointTests = TEST_ENDPOINTS.map(async endpoint => {
          try {
            console.log(`Testing basic connectivity to: ${endpoint}`);
            
            // Using no-cors fetch which is more likely to succeed for connectivity test
            const response = await fetch(endpoint, {
              method: 'HEAD',
              mode: 'no-cors'
            });
            
            console.log(`Endpoint ${endpoint} no-cors test completed`);
            return { success: true, endpoint };
          } catch (endpointError) {
            console.warn(`Endpoint ${endpoint} connectivity test failed:`, endpointError);
            return { success: false, endpoint };
          }
        });
        
        // Wait for all tests to complete
        const results = await Promise.all(endpointTests);
        const successfulTest = results.find(result => result.success);
        
        if (successfulTest) {
          console.log(`Basic connectivity test passed for ${successfulTest.endpoint}`);
          return {
            success: true,
            message: "Basic connectivity test passed. API should be reachable through a backend proxy.",
            endpoint: successfulTest.endpoint
          };
        } else {
          return {
            success: false,
            message: "Cannot establish basic connectivity with any Grok API endpoints. Please check your network connection and API key."
          };
        }
      }
      
      // Non-browser environment - try direct connection
      try {
        const testEndpoint = TEST_ENDPOINTS[0] + '/v1/models';
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
   */
  testApiKeyValidity: async (apiKey: string): Promise<{isValid: boolean, message: string, quotaRemaining?: number}> => {
    try {
      // Simple test query to validate the key
      const testBody = {
        messages: [
          { role: 'user', content: 'Respond with the word "valid" only' }
        ],
        model: "grok-3-mini-beta",
        temperature: 0.1,
        max_tokens: 10
      };
      
      const response = await fetch('/api/grok/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(testBody)
      });
      
      if (response.ok) {
        // Get headers to check for quota/rate limit information
        const rateLimit = response.headers.get('x-ratelimit-remaining') || 
                        response.headers.get('x-rate-limit-remaining');
        
        const quotaRemaining = rateLimit ? parseInt(rateLimit, 10) : undefined;
        
        return {
          isValid: true,
          message: "API key is valid and working",
          quotaRemaining
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          return {
            isValid: false,
            message: "Invalid API key or authorization failed"
          };
        } else if (response.status === 429) {
          return {
            isValid: true, // Key is valid but rate limited
            message: "API key rate limit exceeded. Try again later.",
            quotaRemaining: 0
          };
        } else {
          return {
            isValid: false,
            message: `API error: ${errorData.error?.message || response.statusText || 'Unknown error'}`
          };
        }
      }
    } catch (error) {
      console.error("API key validation test failed:", error);
      return {
        isValid: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }
};

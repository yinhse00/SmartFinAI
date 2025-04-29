
/**
 * API connection testing functionality
 */
import { testEndpointConnectivity } from './testUtils';
import { BASE_ENDPOINTS } from '../constants/apiEndpoints';

/**
 * Tests API connection across multiple endpoints
 */
export const testApiConnection = async (apiKey?: string): Promise<{success: boolean, message: string, endpoint?: string}> => {
  try {
    console.log("Testing Grok API connection...");
    
    if (!apiKey || !apiKey.startsWith('xai-')) {
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
            'Authorization': `Bearer ${apiKey}`
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
      let workingEndpoint = null;
      
      // Test all endpoints in parallel for faster results
      const endpointTests = BASE_ENDPOINTS.map(async endpoint => {
        const success = await testEndpointConnectivity(endpoint);
        return { success, endpoint };
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
      const testEndpoint = BASE_ENDPOINTS[0] + '/v1/models';
      console.log(`Testing direct API call to: ${testEndpoint}`);
      
      const response = await fetch(testEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
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
};

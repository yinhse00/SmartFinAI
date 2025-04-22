
import { getGrokApiKey } from '../../apiKeyService';

// List of potential API endpoints to test
const TEST_ENDPOINTS = [
  'https://api.grok.ai',
  'https://grok-api.com',
  'https://grok.x.ai',
  'https://api.x.ai'
];

export const connectionTester = {
  testApiConnection: async (apiKey?: string): Promise<{success: boolean, message: string}> => {
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
        
        try {
          // Try a proxy approach first if available
          const localProxyUrl = '/api/grok';
          console.log(`Testing local proxy endpoint: ${localProxyUrl}`);
          
          const proxyResponse = await fetch(`${localProxyUrl}/models`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${key}`
            }
          });
          
          if (proxyResponse.ok) {
            console.log("Local proxy connection successful");
            return {
              success: true,
              message: "API connection successful via local proxy"
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
        
        for (const endpoint of TEST_ENDPOINTS) {
          try {
            console.log(`Testing basic connectivity to: ${endpoint}`);
            // Using image request which often has less strict CORS
            const imgTest = new Image();
            imgTest.onload = () => {
              console.log(`Basic connectivity test passed for ${endpoint}`);
              connectivityTestPassed = true;
              workingEndpoint = endpoint;
            };
            imgTest.onerror = () => {
              console.log(`Basic connectivity test failed for ${endpoint}`);
            };
            imgTest.src = `${endpoint}/favicon.ico?${Date.now()}`;
            
            // Also try a simple fetch with no-cors
            const response = await fetch(endpoint, {
              method: 'HEAD',
              mode: 'no-cors'
            });
            
            console.log(`Endpoint ${endpoint} no-cors test completed`);
            connectivityTestPassed = true;
            workingEndpoint = endpoint;
            break;
          } catch (endpointError) {
            console.warn(`Endpoint ${endpoint} connectivity test failed:`, endpointError);
          }
        }
        
        if (connectivityTestPassed && workingEndpoint) {
          console.log(`Basic connectivity test passed for ${workingEndpoint}`);
          return {
            success: true,
            message: "Basic connectivity test passed. API should be reachable through a backend proxy."
          };
        } else {
          return {
            success: false,
            message: "Cannot establish basic connectivity with any Grok API endpoints. Please check your network connection."
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
          console.log("Direct API call successful");
          return {
            success: true,
            message: "API connection successful"
          };
        } else {
          return {
            success: false,
            message: `API error: ${response.status}`
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
  }
};

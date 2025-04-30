
/**
 * Tests direct API connections to various endpoints
 */
import { TEST_ENDPOINTS, TIMEOUTS } from './constants';

/**
 * Test direct connection to a specific endpoint
 * @param endpoint - The endpoint URL to test
 * @param apiKey - The API key to use
 * @returns Promise resolving to an object with test result details
 */
export const testDirectEndpoint = async (
  endpoint: string, 
  apiKey: string
): Promise<{ success: boolean; endpoint: string; message?: string }> => {
  try {
    console.log(`Testing basic connectivity to: ${endpoint}`);
    
    // Try a proper API call first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn(`Direct request to ${endpoint} timed out`);
      }, TIMEOUTS.API_REQUEST);
      
      const testEndpoint = endpoint + '/v1/models';
      const response = await fetch(testEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        mode: 'cors',
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`Endpoint ${endpoint} direct API call successful`);
        return { 
          success: true, 
          endpoint,
          message: `API connection successful to ${endpoint}`
        };
      }
      
      // If proper API call fails, try no-cors HEAD
      console.warn(`API call to ${endpoint} failed with status: ${response.status}`);
    } catch (apiError) {
      // Proceed to fallback test
      console.warn(`API call to ${endpoint} failed:`, apiError);
    }
    
    // Fallback to simple HEAD request which might bypass CORS
    try {
      // Using no-cors fetch which is more likely to succeed for connectivity test
      await fetch(endpoint, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store'
      });
      
      console.log(`Endpoint ${endpoint} basic connectivity test passed`);
      return { 
        success: true, 
        endpoint,
        message: `Basic connectivity to ${endpoint} successful (but may have CORS restrictions)`
      };
    } catch (headError) {
      console.warn(`Endpoint ${endpoint} connectivity test failed completely`);
      return { 
        success: false, 
        endpoint,
        message: headError instanceof Error ? headError.message : String(headError)
      };
    }
  } catch (error) {
    console.warn(`Endpoint ${endpoint} connectivity test failed:`, error);
    return { 
      success: false, 
      endpoint,
      message: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Test direct connections to all available endpoints
 * @param apiKey - The API key to use for testing
 * @returns Promise resolving to the best available endpoint, if any
 */
export const testAllDirectEndpoints = async (
  apiKey: string
): Promise<{ success: boolean; endpoint?: string; message: string }> => {
  // Test all endpoints in parallel for faster results
  const endpointTests = TEST_ENDPOINTS.map(endpoint => testDirectEndpoint(endpoint, apiKey));
  
  // Wait for all tests to complete
  const results = await Promise.all(endpointTests);
  const successfulTest = results.find(result => result.success);
  
  if (successfulTest) {
    return {
      success: true,
      message: successfulTest.message || `Basic connectivity test passed for ${successfulTest.endpoint}`,
      endpoint: successfulTest.endpoint
    };
  } else {
    return {
      success: false,
      message: "Cannot establish connectivity with any Grok API endpoints. Please check your network connection and API key."
    };
  }
};


/**
 * Utility functions for API connectivity testing
 */

/**
 * Tests basic connectivity to an endpoint
 */
export const testEndpointConnectivity = async (
  endpoint: string,
  mode: 'cors' | 'no-cors' = 'no-cors'
): Promise<boolean> => {
  try {
    console.log(`Testing basic connectivity to: ${endpoint}`);
    
    // Using fetch with specified mode which is more likely to succeed for connectivity test
    const response = await fetch(endpoint, {
      method: 'HEAD',
      mode
    });
    
    console.log(`Endpoint ${endpoint} ${mode} test completed`);
    return true;
  } catch (endpointError) {
    console.warn(`Endpoint ${endpoint} connectivity test failed:`, endpointError);
    return false;
  }
};

/**
 * Format error message based on HTTP status and error data
 */
export const formatErrorMessage = (status: number, errorData: any): string => {
  if (status === 401) {
    return "Invalid API key or authorization failed";
  } else if (status === 429) {
    return "API key rate limit exceeded. Try again later.";
  } else {
    return `API error: ${errorData.error?.message || 'Unknown error'}`;
  }
};

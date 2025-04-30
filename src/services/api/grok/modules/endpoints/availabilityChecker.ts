
/**
 * Checks API availability across different endpoints
 */
import { LOCAL_PROXY, BASE_ENDPOINTS, TIMEOUTS } from './config';

/**
 * Checks API availability with the local proxy
 * @returns true if available, false otherwise
 */
const checkProxyAvailability = async (apiKey: string): Promise<boolean> => {
  try {
    console.log("Testing local proxy endpoint: /api/grok");
    
    // Use AbortController for better timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.AVAILABILITY_CHECK);
    
    const proxyResponse = await fetch('/api/grok/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Request-Source': 'browser-client',
        'Accept': 'application/json'
      },
      signal: controller.signal,
      credentials: 'same-origin'
    });
    
    clearTimeout(timeoutId);
    
    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      const modelCount = data?.data?.length || 0;
      console.log(`Local proxy connection successful, found ${modelCount} models`);
      return true;
    }
    
    console.warn("Local proxy availability check failed with status:", proxyResponse.status);
    return false;
  } catch (e) {
    console.warn("Local proxy availability check failed:", e instanceof Error ? e.message : String(e));
    return false;
  }
};

/**
 * Checks direct endpoint availability
 * @returns true if any endpoint is available, false otherwise
 */
const checkDirectEndpointAvailability = async (apiKey: string): Promise<boolean> => {
  try {
    console.log("Trying direct API endpoints...");
    
    const endpointChecks = BASE_ENDPOINTS.map(async (baseEndpoint) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.NO_CORS_CHECK);
        
        // First try with proper CORS mode
        const response = await fetch(`${baseEndpoint}/v1/models`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          },
          mode: 'cors',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`Direct endpoint ${baseEndpoint} is available`);
          return true;
        }
        
        // For CORS errors, try a no-cors HEAD request just to check connectivity
        try {
          const responseHead = await fetch(baseEndpoint, {
            method: 'HEAD',
            mode: 'no-cors'
          });
          
          // If we get here, the server is reachable, but we may have CORS issues
          console.log(`Endpoint ${baseEndpoint} is reachable but may have CORS restrictions`);
          return false;
        } catch (headError) {
          // Both attempts failed, endpoint is likely down
          return false;
        }
      } catch (e) {
        return false;
      }
    });
    
    // Wait for any endpoint check to succeed, or all to fail
    const results = await Promise.allSettled(endpointChecks);
    return results.some(result => result.status === 'fulfilled' && result.value === true);
  } catch (e) {
    console.error("Direct endpoint availability check failed:", e);
    return false;
  }
};

/**
 * Main function to check API availability
 */
export const checkApiAvailability = async (apiKey: string): Promise<boolean> => {
  if (!apiKey || !apiKey.startsWith('xai-')) {
    console.error("Invalid API key format for availability check");
    return false;
  }
  
  console.log("Checking Grok API availability...");
  
  try {
    // Try the proxy first (most likely to work)
    const isProxyAvailable = await checkProxyAvailability(apiKey);
    if (isProxyAvailable) {
      return true;
    }
    
    // If proxy fails, try direct endpoints
    const isDirectAvailable = await checkDirectEndpointAvailability(apiKey);
    if (isDirectAvailable) {
      console.log("At least one direct API endpoint is available");
      return true;
    }
    
    console.error("All API endpoints are unreachable");
    return false;
  } catch (e) {
    console.error("API availability check failed completely:", e);
    return false;
  }
};

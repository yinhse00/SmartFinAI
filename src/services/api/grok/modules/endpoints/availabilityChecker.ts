
/**
 * API availability checking functionality
 */
import { BASE_ENDPOINTS, TIMEOUTS } from './constants';

/**
 * Attempts to test the local proxy endpoint
 */
const testLocalProxy = async (apiKey: string): Promise<boolean> => {
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
        'Cache-Control': 'no-cache, no-store' // Prevent browser caching
      },
      signal: controller.signal,
      cache: 'no-store',
      mode: 'cors'
    });
    
    clearTimeout(timeoutId);
    
    if (proxyResponse.ok) {
      // Check content type to verify it's JSON
      const contentType = proxyResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const data = await proxyResponse.json();
          const modelCount = data?.data?.length || 0;
          console.log(`Local proxy connection successful, found ${modelCount} models`);
          return true;
        } catch (jsonError) {
          console.warn("Local proxy returned invalid JSON:", jsonError);
          return false;
        }
      } else {
        // Additional check for HTML responses which indicate CORS issues
        try {
          const text = await proxyResponse.text();
          const isHtmlResponse = text.includes('<!DOCTYPE html>') || text.includes('<html');
          console.warn(`Local proxy returned ${isHtmlResponse ? 'HTML' : 'non-JSON'} response`);
          return false;
        } catch (e) {
          console.warn("Local proxy returned unreadable response");
          return false;
        }
      }
    }
    
    console.warn("Local proxy availability check failed with status:", proxyResponse.status);
    return false;
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    const isNetworkError = errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch');
    console.warn("Local proxy availability check failed:", isNetworkError ? "Network connectivity issue" : errorMessage);
    return false;
  }
};

/**
 * Tests a basic connectivity to an endpoint
 */
const testEndpointConnectivity = async (baseEndpoint: string, apiKey: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.ENDPOINT_CHECK);
    
    // First try with proper CORS mode
    const response = await fetch(`${baseEndpoint}/v1/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Cache-Control': 'no-cache, no-store'
      },
      mode: 'cors',
      signal: controller.signal,
      cache: 'no-store'
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      // Check that response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        console.log(`Direct endpoint ${baseEndpoint} is available`);
        return true;
      } else {
        console.warn(`Direct endpoint ${baseEndpoint} returned non-JSON response`);
        return false;
      }
    }
    
    return false;
  } catch (e) {
    // For CORS errors, try a no-cors HEAD request just to check connectivity
    try {
      console.log(`Endpoint ${baseEndpoint} CORS request failed, trying no-cors HEAD request`);
      const responseHead = await fetch(`${baseEndpoint}`, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store' // Prevent caching
      });
      
      // If we get here, the server is reachable, but we may have CORS issues
      console.log(`Endpoint ${baseEndpoint} is reachable but may have CORS restrictions`);
      return true;  // Return true since the endpoint is accessible, even though we might have CORS issues
    } catch (headError) {
      // Both attempts failed, endpoint is likely down
      console.warn(`Endpoint ${baseEndpoint} connectivity test failed completely`);
      return false;
    }
  }
};

// Improved version of checkApiAvailability with more reliable detection
export const checkApiAvailability = async (apiKey: string): Promise<boolean> => {
  if (!apiKey || !apiKey.startsWith('xai-')) {
    console.error("Invalid API key format for availability check");
    return false;
  }
  
  console.log("Checking Grok API availability...");
  
  try {
    // Try the proxy first (most likely to work)
    const proxyAvailable = await testLocalProxy(apiKey);
    if (proxyAvailable) {
      return true;
    }
    
    // If proxy fails, try direct endpoints
    console.log("Trying direct API endpoints...");
    
    // Try each endpoint individually for better error reporting
    for (const baseEndpoint of BASE_ENDPOINTS) {
      try {
        const endpointAvailable = await testEndpointConnectivity(baseEndpoint, apiKey);
        if (endpointAvailable) {
          console.log(`Direct endpoint ${baseEndpoint} is available`);
          return true;
        }
      } catch (endpointError) {
        console.warn(`API call to ${baseEndpoint} failed:`, endpointError);
      }
    }
    
    console.error("All API endpoints are unreachable");
    return false;
  } catch (e) {
    console.error("API availability check failed completely:", e);
    return false;
  }
};

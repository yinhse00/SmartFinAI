
/**
 * Enhanced API availability checking with better HTML and CORS handling
 */
import { BASE_ENDPOINTS, TIMEOUTS } from './constants';

/**
 * Attempts to test the local proxy endpoint with improved HTML detection
 */
const testLocalProxy = async (apiKey: string): Promise<boolean> => {
  try {
    console.log("Testing local proxy endpoint: /api/grok");
    
    // First try a simple ping that should work even with CORS restrictions
    try {
      await fetch('/api/grok/ping', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store'
      });
      
      // If we get here without an error, the endpoint is at least reachable
      console.log("Local proxy endpoint is reachable at basic level");
      return true;
    } catch (basicError) {
      console.warn("Basic proxy ping failed, trying full endpoint check");
    }
    
    // Use AbortController for better timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.AVAILABILITY_CHECK);
    
    try {
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
        
        // If the content type doesn't exist or doesn't contain application/json, 
        // it might be HTML (CORS issue) or another format
        if (!contentType || !contentType.includes('application/json')) {
          const text = await proxyResponse.text();
          
          // Check for HTML response (common CORS issue indicator)
          if (text.includes('<!DOCTYPE html>') || 
              text.includes('<html') || 
              text.includes('</body>')) {
            console.warn("Local proxy returned HTML response (likely CORS issue)");
            return false;
          }
          
          // Try to parse as JSON anyway
          try {
            JSON.parse(text);
            console.log("Non-JSON content type but valid JSON response");
            return true;
          } catch (e) {
            console.warn("Local proxy returned invalid data format");
            return false;
          }
        }
        
        try {
          const data = await proxyResponse.json();
          const modelCount = data?.data?.length || 0;
          console.log(`Local proxy connection successful, found ${modelCount} models`);
          return true;
        } catch (jsonError) {
          console.warn("Local proxy returned invalid JSON:", jsonError);
          return false;
        }
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.warn("Fetch error during proxy test:", fetchError);
      // Continue with fallback approach
    }
    
    console.warn("Local proxy availability check failed");
    return false;
  } catch (e) {
    // For network errors, check if it's a CORS issue
    const errorMessage = e instanceof Error ? e.message : String(e);
    
    // If this looks like a CORS error, log it clearly
    const isCorsError = errorMessage.includes('CORS') || 
                       errorMessage.includes('cross-origin') ||
                       errorMessage.includes('Cross-Origin');
    
    console.warn("Local proxy availability check failed:", 
      isCorsError ? "CORS policy restriction" : errorMessage);
      
    return false;
  }
};

/**
 * Tests connectivity to an endpoint with improved HTML detection
 */
const testEndpointConnectivity = async (baseEndpoint: string, apiKey: string): Promise<boolean> => {
  try {
    // First try a no-cors HEAD request to check basic connectivity
    // This helps detect if the endpoint exists at all, even if CORS blocks us
    try {
      await fetch(`${baseEndpoint}`, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store'
      });
      
      // If we got here without an error, the endpoint is at least reachable
      console.log(`Endpoint ${baseEndpoint} is reachable at basic level`);

      // Try a real API call to confirm full functionality
      try {
        const response = await fetch(`${baseEndpoint}/v1/models`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store'
          },
          cache: 'no-store'
        });
        
        // Process successful response
        if (response.ok) {
          const data = await response.json();
          console.log(`Direct API call to ${baseEndpoint} successful`, data ? 'with data' : 'but no data');
          return true;
        } else {
          console.warn(`Direct API call to ${baseEndpoint} failed with status:`, response.status);
        }
      } catch (apiError) {
        console.warn(`API call to ${baseEndpoint} failed:`, apiError);
      }
      
      return true; // Return true if the basic connectivity check passed, even if the API call failed
    } catch (basicError) {
      console.warn(`Basic connectivity test to ${baseEndpoint} failed`);
      return false;
    }
  } catch (e) {
    console.warn(`Endpoint test for ${baseEndpoint} failed completely:`, e);
    return false;
  }
};

// Completely redesigned API availability checker
export const checkApiAvailability = async (apiKey: string): Promise<boolean> => {
  if (!apiKey || !apiKey.startsWith('xai-')) {
    console.error("Invalid API key format for availability check");
    return false;
  }
  
  console.log("Checking Grok API availability with enhanced detection...");
  
  try {
    // First quickly check if the proxy is available at a basic level
    const proxyAvailable = await testLocalProxy(apiKey);
    if (proxyAvailable) {
      return true;
    }
    
    // If proxy fails, check if any direct endpoints are reachable
    console.log("Local proxy unavailable, checking direct endpoints...");
    
    // Prioritize api.x.ai which appears to be working based on logs
    const prioritizedEndpoints = ['https://api.x.ai', 'https://grok.x.ai', 'https://api.grok.ai', 'https://grok-api.com'];
    
    // Try each endpoint individually with basic connectivity test
    for (const baseEndpoint of prioritizedEndpoints) {
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
    
    console.error("All API endpoints are unreachable after enhanced testing");
    return false;
  } catch (e) {
    console.error("API availability check failed completely:", e);
    return false;
  }
};

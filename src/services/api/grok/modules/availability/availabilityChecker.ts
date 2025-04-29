
/**
 * Checks API availability
 */
import { BASE_ENDPOINTS } from '../constants/apiEndpoints';

// Improved version of checkApiAvailability with more reliable detection
export const checkApiAvailability = async (apiKey: string): Promise<boolean> => {
  if (!apiKey || !apiKey.startsWith('xai-')) {
    console.error("Invalid API key format for availability check");
    return false;
  }
  
  console.log("Checking Grok API availability...");
  
  try {
    // Try the proxy first (most likely to work)
    try {
      console.log("Testing local proxy endpoint: /api/grok");
      
      // Use AbortController for better timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const proxyResponse = await fetch('/api/grok/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-Request-Source': 'browser-client', // Add custom header for tracking
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (proxyResponse.ok) {
        const data = await proxyResponse.json();
        const modelCount = data?.data?.length || 0;
        console.log(`Local proxy connection successful, found ${modelCount} models`);
        return true;
      }
      
      console.warn("Local proxy availability check failed with status:", proxyResponse.status);
    } catch (e) {
      console.warn("Local proxy availability check failed:", e instanceof Error ? e.message : String(e));
    }
    
    // If proxy fails, try direct endpoints
    console.log("Trying direct API endpoints...");
    
    // Use Promise.any to race all endpoint checks and return as soon as any succeeds
    const endpointChecks = BASE_ENDPOINTS.map(async (baseEndpoint) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        // First try with proper CORS mode
        const response = await fetch(`${baseEndpoint}/v1/models`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
          mode: 'cors',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`Direct endpoint ${baseEndpoint} is available`);
          return true;
        }
        
        return false;
      } catch (e) {
        // For CORS errors, try a no-cors HEAD request just to check connectivity
        try {
          const responseHead = await fetch(`${baseEndpoint}`, {
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
      }
    });
    
    // Wait for any endpoint check to succeed, or all to fail
    const results = await Promise.allSettled(endpointChecks);
    const anySucceeded = results.some(result => result.status === 'fulfilled' && result.value === true);
    
    if (anySucceeded) {
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

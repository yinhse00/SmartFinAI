
/**
 * Manages API endpoints and connection attempts
 */

// Local proxy endpoint if available
export const LOCAL_PROXY = '/api/grok/chat/completions';

// Available API endpoints for direct calls
export const API_ENDPOINTS = [
  'https://api.grok.ai/v1/chat/completions',
  'https://grok-api.com/v1/chat/completions',
  'https://grok.x.ai/v1/chat/completions',
  'https://api.x.ai/v1/chat/completions'
];

/**
 * Attempt API call using local proxy
 */
export const attemptProxyRequest = async (
  requestBody: any, 
  apiKey: string
): Promise<any> => {
  console.log("Attempting API call via local proxy at:", LOCAL_PROXY);
  
  try {
    // Use AbortController for better timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn("Proxy request timed out after 30 seconds");
    }, 30000); // 30 second timeout
    
    const proxyResponse = await fetch(LOCAL_PROXY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Request-Source': 'browser-client', // Add custom header for tracking
        'X-Request-ID': `req-${Date.now()}`, // Add request ID for tracing
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
      // Explicitly set credentials for CORS
      credentials: 'same-origin'
    });
    
    clearTimeout(timeoutId);
    
    if (proxyResponse.ok) {
      console.log("Proxy request successful with status:", proxyResponse.status);
      return await proxyResponse.json();
    }
    
    console.warn(`Proxy request failed with status: ${proxyResponse.status}`);
    
    // Try to get detailed error message
    let errorText = "";
    try {
      errorText = await proxyResponse.text();
    } catch (e) {}
    
    throw new Error(`Proxy request failed with status: ${proxyResponse.status}${errorText ? ` - ${errorText}` : ''}`);
  } catch (error) {
    // Better error handling with specific messages for different error types
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error("Proxy request timed out");
      throw new Error("Proxy request timed out - server may be overloaded");
    } else if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error("Network error during proxy request - likely CORS or connectivity issue");
      throw new Error("Network error - check your internet connection and proxy configuration");
    }
    
    console.warn("Proxy request error:", error);
    throw error;
  }
};

/**
 * Attempt direct API calls to various endpoints
 */
export const attemptDirectRequest = async (
  requestBody: any, 
  apiKey: string
): Promise<any> => {
  const errors: Error[] = [];
  
  for (const apiEndpoint of API_ENDPOINTS) {
    try {
      console.log(`Attempting direct API call to: ${apiEndpoint}`);
      
      // Use AbortController for better timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn(`Direct request to ${apiEndpoint} timed out after 20 seconds`);
      }, 20000); // 20 second timeout for direct requests
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Origin': window.location.origin,
          'X-Request-Source': 'browser-client', // Add custom header for tracking
          'X-Request-ID': `req-${Date.now()}` // Add request ID for tracing
        },
        body: JSON.stringify(requestBody),
        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`Direct API call to ${apiEndpoint} successful`);
        return await response.json();
      }
      
      console.warn(`Endpoint ${apiEndpoint} returned status: ${response.status}`);
      
      // Add more detailed error information
      let errorDetails = `Status ${response.status} from ${apiEndpoint}`;
      try {
        const errorData = await response.text();
        if (errorData) {
          errorDetails += ` - ${errorData}`;
        }
      } catch (e) {
        // Ignore error parsing errors
      }
      
      errors.push(new Error(errorDetails));
    } catch (endpointError) {
      console.warn(`Endpoint ${apiEndpoint} failed:`, endpointError);
      errors.push(endpointError instanceof Error ? endpointError : new Error(String(endpointError)));
      // Continue to next endpoint
    }
  }
  
  // If we get here, all endpoints failed
  const errorMessage = errors.map(e => e.message).join('; ');
  throw new Error(`All API endpoints failed: ${errorMessage}`);
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
    try {
      console.log("Testing local proxy endpoint: /api/grok");
      
      // Use AbortController for better timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const proxyResponse = await fetch('/api/grok/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-Request-Source': 'browser-client',
          'Accept': 'application/json'
        },
        signal: controller.signal,
        credentials: 'same-origin' // Added explicit credentials handling
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
    const endpointChecks = [
      'https://api.grok.ai',
      'https://grok-api.com',
      'https://grok.x.ai',
      'https://api.x.ai'
    ].map(async (baseEndpoint) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
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


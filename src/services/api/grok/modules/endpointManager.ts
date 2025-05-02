
/**
 * Manages API endpoints and connection attempts with improved CORS handling
 */

// Local proxy endpoint if available
export const LOCAL_PROXY = '/api/grok/chat/completions';

// Available API endpoints for direct calls
export const API_ENDPOINTS = [
  'https://api.x.ai/v1/chat/completions',
  'https://api.grok.ai/v1/chat/completions',
  'https://grok-api.com/v1/chat/completions',
  'https://grok.x.ai/v1/chat/completions'
];

// Circuit breaker implementation to avoid repeatedly trying failing endpoints
const endpointCircuitBreakers = new Map<string, {failures: number, lastFailure: number}>();
const MAX_FAILURES = 3;
const RESET_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Check if an endpoint is in a failed state (circuit open)
function isCircuitOpen(endpoint: string): boolean {
  const breaker = endpointCircuitBreakers.get(endpoint);
  if (!breaker) return false;
  
  // Reset circuit breaker after timeout
  if (Date.now() - breaker.lastFailure > RESET_TIMEOUT) {
    endpointCircuitBreakers.delete(endpoint);
    console.log(`Circuit breaker reset for ${endpoint}`);
    return false;
  }
  
  return breaker.failures >= MAX_FAILURES;
}

// Record endpoint failure and potentially open circuit
function recordEndpointFailure(endpoint: string): void {
  const breaker = endpointCircuitBreakers.get(endpoint) || { failures: 0, lastFailure: Date.now() };
  breaker.failures++;
  breaker.lastFailure = Date.now();
  
  endpointCircuitBreakers.set(endpoint, breaker);
  
  if (breaker.failures >= MAX_FAILURES) {
    console.log(`Circuit breaker opened for ${endpoint} after ${breaker.failures} failures`);
  }
}

// Record endpoint success and reset circuit if needed
function recordEndpointSuccess(endpoint: string): void {
  if (endpointCircuitBreakers.has(endpoint)) {
    endpointCircuitBreakers.delete(endpoint);
    console.log(`Circuit breaker reset after successful call to ${endpoint}`);
  }
}

/**
 * Enhanced proxy request with better CORS handling
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
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',  // Prevent caching for fresh responses
        'X-API-Key-Rotation': 'enabled' // Signal key rotation is enabled
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
      credentials: 'same-origin', // Use same-origin for local proxy requests
      redirect: 'follow' // Follow redirects in case the API endpoint changes
    });
    
    clearTimeout(timeoutId);
    
    if (proxyResponse.ok) {
      console.log("Proxy request successful with status:", proxyResponse.status);
      return await proxyResponse.json();
    }
    
    // More detailed error handling for different status codes
    if (proxyResponse.status === 403) {
      console.warn("Proxy request failed with 403 Forbidden - API key may be invalid");
      throw new Error("API key authentication failed (403 Forbidden)");
    } else if (proxyResponse.status === 429) {
      console.warn("Proxy request failed with 429 Too Many Requests - rate limit exceeded");
      throw new Error("API rate limit exceeded. Please try again later (429)");
    } else if (proxyResponse.status === 502 || proxyResponse.status === 504) {
      console.warn(`Proxy gateway error (${proxyResponse.status}) - backend may be unreachable`);
      throw new Error(`Gateway error (${proxyResponse.status}). API service may be down`);
    }
    
    // Generic error with status
    console.warn(`Proxy request failed with status: ${proxyResponse.status}`);
    throw new Error(`Proxy request failed with status: ${proxyResponse.status}`);
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
 * Attempt direct API calls with enhanced circuit breaker pattern
 */
export const attemptDirectRequest = async (
  requestBody: any, 
  apiKey: string
): Promise<any> => {
  const errors: Error[] = [];
  
  // If this is a batch continuation request, prioritize different endpoints
  const isBatchContinuation = requestBody.messages?.some((msg: any) => 
    typeof msg.content === 'string' && 
    msg.content.includes('[CONTINUATION_PART_')
  );
  
  // Reorder endpoints for batch continuation to try different servers
  let endpoints = [...API_ENDPOINTS];
  if (isBatchContinuation) {
    // For continuations, shuffle the endpoints to increase chances of success
    endpoints = endpoints.sort(() => Math.random() - 0.5);
  }
  
  // Filter out endpoints with open circuit breakers
  const availableEndpoints = endpoints.filter(endpoint => !isCircuitOpen(endpoint));
  
  if (availableEndpoints.length === 0) {
    console.warn("All endpoints have open circuit breakers. Using original endpoints and resetting.");
    // Reset all circuit breakers when no endpoints are available
    endpointCircuitBreakers.clear();
  }
  
  const endpointsToTry = availableEndpoints.length > 0 ? availableEndpoints : endpoints;
  
  for (const apiEndpoint of endpointsToTry) {
    try {
      console.log(`Attempting direct API call to: ${apiEndpoint}`);
      
      // Use AbortController for better timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn(`Direct request to ${apiEndpoint} timed out after 20 seconds`);
      }, 20000); // 20 second timeout for direct requests
      
      // Enhanced fetch options to handle CORS
      const options: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Origin': window.location.origin,
          'X-Request-Source': 'browser-client',
          'X-Request-ID': `req-${Date.now()}`,
          'X-Batch-Request': isBatchContinuation ? 'true' : 'false',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(requestBody),
        mode: 'cors',
        signal: controller.signal,
        credentials: 'omit', // Avoid sending cookies for cross-origin requests
        keepalive: true // Keep connection alive for large responses
      };
      
      const response = await fetch(apiEndpoint, options);
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`Direct API call to ${apiEndpoint} successful`);
        recordEndpointSuccess(apiEndpoint);
        return await response.json();
      }
      
      console.warn(`Endpoint ${apiEndpoint} returned status: ${response.status}`);
      
      // Record endpoint failure for circuit breaker
      recordEndpointFailure(apiEndpoint);
      
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
      recordEndpointFailure(apiEndpoint);
      errors.push(endpointError instanceof Error ? endpointError : new Error(String(endpointError)));
      // Continue to next endpoint
    }
  }
  
  // If we get here, all endpoints failed
  const errorMessage = errors.map(e => e.message).join('; ');
  throw new Error(`All API endpoints failed: ${errorMessage}`);
};

/**
 * Enhanced API availability check with better CORS handling
 */
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
      
      // Try simpler proxy paths first
      const proxyPaths = [
        '/api/grok/models',
        '/api/grok'
      ];
      
      for (const path of proxyPaths) {
        try {
          const proxyResponse = await fetch(path, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'X-Request-Source': 'browser-client',
              'Accept': 'application/json',
              'Cache-Control': 'no-cache, no-store'
            },
            signal: controller.signal,
            credentials: 'same-origin'
          });
          
          if (proxyResponse.ok) {
            clearTimeout(timeoutId);
            console.log(`Local proxy connection successful via ${path}`);
            return true;
          }
        } catch (pathError) {
          console.warn(`Path ${path} check failed:`, pathError);
          // Continue to next path
        }
      }
      
      clearTimeout(timeoutId);
      console.warn("All proxy paths failed");
    } catch (e) {
      console.warn("Local proxy availability check failed:", e instanceof Error ? e.message : String(e));
    }
    
    // Use options preflight as a reliable connection test
    try {
      const preflightResponse = await fetch('/api/grok', { 
        method: 'OPTIONS',
        headers: {
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
      });
      
      if (preflightResponse.ok || preflightResponse.status === 204) {
        console.log("CORS preflight request succeeded");
        return true;
      }
    } catch (preflightError) {
      console.warn("CORS preflight check failed:", preflightError);
    }
    
    // Fallback to a ping on the root endpoint
    try {
      const pingResponse = await fetch('/api/grok', {
        method: 'HEAD'
      });
      
      if (pingResponse.ok) {
        console.log("API root ping successful");
        return true;
      }
    } catch (pingError) {
      console.warn("API ping failed:", pingError);
    }
    
    // Last resort - try no-cors mode which should always work if server exists
    try {
      await fetch('/api/grok', {
        mode: 'no-cors',
        method: 'HEAD'
      });
      
      // If we got here, the server is at least reachable
      console.log("API is reachable but may have CORS issues");
      return true;
    } catch (e) {
      console.error("API is completely unreachable");
      return false;
    }
  } catch (e) {
    console.error("API availability check failed completely:", e);
    return false;
  }
};


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

// Circuit breaker implementation with more lenient settings for complex queries
const endpointCircuitBreakers = new Map<string, {failures: number, lastFailure: number, complexQueryFailures: number}>();
const MAX_FAILURES = 3; // Keep standard failure limit
const MAX_COMPLEX_FAILURES = 5; // More lenient for complex queries
const RESET_TIMEOUT = 5 * 60 * 1000; // 5 minutes - standard timeout
const COMPLEX_RESET_TIMEOUT = 2 * 60 * 1000; // 2 minutes - shorter timeout for complex queries

// Check if an endpoint is in a failed state (circuit open)
function isCircuitOpen(endpoint: string, isComplexQuery = false): boolean {
  const breaker = endpointCircuitBreakers.get(endpoint);
  if (!breaker) return false;
  
  // Reset circuit breaker after timeout
  if (Date.now() - breaker.lastFailure > (isComplexQuery ? COMPLEX_RESET_TIMEOUT : RESET_TIMEOUT)) {
    endpointCircuitBreakers.delete(endpoint);
    console.log(`Circuit breaker reset for ${endpoint} (complex query: ${isComplexQuery})`);
    return false;
  }
  
  // Use different failure thresholds based on query complexity
  const maxAllowedFailures = isComplexQuery ? MAX_COMPLEX_FAILURES : MAX_FAILURES;
  
  // For complex queries, use the dedicated complex failure counter
  const failureCount = isComplexQuery ? breaker.complexQueryFailures : breaker.failures;
  
  return failureCount >= maxAllowedFailures;
}

// Record endpoint failure and potentially open circuit
function recordEndpointFailure(endpoint: string, isComplexQuery = false): void {
  const breaker = endpointCircuitBreakers.get(endpoint) || { 
    failures: 0, 
    lastFailure: Date.now(),
    complexQueryFailures: 0 
  };
  
  // Increment appropriate failure counter
  if (isComplexQuery) {
    breaker.complexQueryFailures++;
  } else {
    breaker.failures++;
  }
  
  breaker.lastFailure = Date.now();
  
  endpointCircuitBreakers.set(endpoint, breaker);
  
  const maxAllowedFailures = isComplexQuery ? MAX_COMPLEX_FAILURES : MAX_FAILURES;
  const failureCount = isComplexQuery ? breaker.complexQueryFailures : breaker.failures;
  
  if (failureCount >= maxAllowedFailures) {
    console.log(`Circuit breaker opened for ${endpoint} after ${failureCount} failures (complex query: ${isComplexQuery})`);
  }
}

// Record endpoint success and reset circuit if needed
function recordEndpointSuccess(endpoint: string): void {
  if (endpointCircuitBreakers.has(endpoint)) {
    endpointCircuitBreakers.delete(endpoint);
    console.log(`Circuit breaker reset after successful call to ${endpoint}`);
  }
}

// Force reset all circuit breakers - for recovery from system-wide issues
export function forceResetAllCircuitBreakers(): void {
  const breakerCount = endpointCircuitBreakers.size;
  endpointCircuitBreakers.clear();
  console.log(`Force reset ${breakerCount} circuit breakers`);
}

/**
 * Enhanced proxy request with better CORS handling
 */
export const attemptProxyRequest = async (
  requestBody: any, 
  apiKey: string
): Promise<any> => {
  console.log("Attempting API call via local proxy at:", LOCAL_PROXY);
  
  // Detect complex queries that might need special handling
  const isComplexQuery = isComplexFinancialQuery(requestBody);
  if (isComplexQuery) {
    console.log("Complex financial query detected, using enhanced handling");
  }
  
  try {
    // Use AbortController for better timeout handling - longer timeout for complex queries
    const controller = new AbortController();
    const timeoutDuration = isComplexQuery ? 60000 : 30000; // 60 seconds for complex, 30 for normal
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn(`Proxy request timed out after ${timeoutDuration/1000} seconds`);
    }, timeoutDuration);
    
    const proxyResponse = await fetch(LOCAL_PROXY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Request-Source': 'browser-client',
        'X-Request-ID': `req-${Date.now()}`,
        'X-Complex-Query': isComplexQuery ? 'true' : 'false', // Signal complex query to backend
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'X-API-Key-Rotation': 'enabled'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
      credentials: 'same-origin', 
      redirect: 'follow'
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
  
  // Check if this is a complex financial query
  const isComplexQuery = isComplexFinancialQuery(requestBody);
  
  // Reorder endpoints for batch continuation to try different servers
  let endpoints = [...API_ENDPOINTS];
  if (isBatchContinuation || isComplexQuery) {
    // For continuations and complex queries, shuffle the endpoints to increase chances of success
    endpoints = endpoints.sort(() => Math.random() - 0.5);
  }
  
  // Filter out endpoints with open circuit breakers
  const availableEndpoints = endpoints.filter(endpoint => !isCircuitOpen(endpoint, isComplexQuery));
  
  if (availableEndpoints.length === 0) {
    console.warn("All endpoints have open circuit breakers. Using original endpoints and resetting.");
    // Reset all circuit breakers when no endpoints are available
    endpointCircuitBreakers.clear();
  }
  
  const endpointsToTry = availableEndpoints.length > 0 ? availableEndpoints : endpoints;
  
  for (const apiEndpoint of endpointsToTry) {
    try {
      console.log(`Attempting direct API call to: ${apiEndpoint} (complex query: ${isComplexQuery})`);
      
      // Use AbortController for better timeout handling - longer timeout for complex queries
      const controller = new AbortController();
      const timeoutDuration = isComplexQuery ? 40000 : 20000; // 40 second timeout for complex queries
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn(`Direct request to ${apiEndpoint} timed out after ${timeoutDuration/1000} seconds`);
      }, timeoutDuration);
      
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
          'X-Complex-Query': isComplexQuery ? 'true' : 'false',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(requestBody),
        mode: 'cors',
        signal: controller.signal,
        credentials: 'omit',
        keepalive: true
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
      recordEndpointFailure(apiEndpoint, isComplexQuery);
      
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
      recordEndpointFailure(apiEndpoint, isComplexQuery);
      errors.push(endpointError instanceof Error ? endpointError : new Error(String(endpointError)));
      // Continue to next endpoint
    }
  }
  
  // If we get here, all endpoints failed
  const errorMessage = errors.map(e => e.message).join('; ');
  throw new Error(`All API endpoints failed: ${errorMessage}`);
};

/**
 * Helper to identify complex financial queries
 */
function isComplexFinancialQuery(requestBody: any): boolean {
  // Find user message to check content
  const userMessage = requestBody.messages?.find((msg: any) => msg.role === 'user');
  if (!userMessage || typeof userMessage.content !== 'string') return false;
  
  const content = userMessage.content.toLowerCase();
  
  // Check for keywords that indicate complex financial queries
  const complexQueryIndicators = [
    'rights issue',
    'whitewash waiver',
    'very substantial acquisition',
    'connected transaction',
    'timetable',
    'chapter 14a',
    'aggregate',
    'rule 7.19a',
    'takeovers code',
    'listing rules',
    'schedule',
    'connected person'
  ];
  
  // Check for multiple indicators or long query
  const indicatorCount = complexQueryIndicators.filter(indicator => 
    content.includes(indicator)
  ).length;
  
  // Consider it complex if it has multiple indicators or is very long
  return indicatorCount >= 2 || content.length > 200;
}

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


/**
 * Client for making API requests via local proxy
 */
import { LOCAL_PROXY, TIMEOUTS, getProxyHeaders } from './config';

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
    }, TIMEOUTS.PROXY_REQUEST);
    
    // Add client timestamp to detect stale responses
    const clientTimestamp = Date.now();
    if (typeof requestBody === 'object') {
      requestBody._clientTimestamp = clientTimestamp;
    }
    
    // Enhanced headers with more browser-like values
    const headers = {
      ...getProxyHeaders(apiKey),
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'X-Client-Timestamp': clientTimestamp.toString()
    };
    
    const proxyResponse = await fetch(LOCAL_PROXY, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal,
      credentials: 'include' // Send cookies if any, helpful for some proxy setups
    });
    
    clearTimeout(timeoutId);
    
    if (proxyResponse.ok) {
      console.log("Proxy request successful with status:", proxyResponse.status);
      return await proxyResponse.json();
    }
    
    console.warn(`Proxy request failed with status: ${proxyResponse.status}`);
    
    // Handle specific error codes
    if (proxyResponse.status === 401) {
      throw new Error("API authentication failed - check your API key");
    } else if (proxyResponse.status === 403) {
      throw new Error("API access forbidden - check your account permissions");
    } else if (proxyResponse.status === 429) {
      throw new Error("API rate limit exceeded - please wait before trying again");
    }
    
    // Try to get detailed error message
    let errorText = "";
    try {
      const errorBody = await proxyResponse.text();
      try {
        const errorJson = JSON.parse(errorBody);
        errorText = errorJson.error || errorJson.message || errorBody;
      } catch {
        errorText = errorBody;
      }
    } catch (e) {
      errorText = "Unable to parse error response";
    }
    
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

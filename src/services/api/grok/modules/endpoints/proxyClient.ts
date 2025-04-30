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
    
    // Check if this is a continuation request and tag it for routing
    const userMessage = requestBody.messages?.find((msg: any) => msg.role === 'user');
    const isContinuation = userMessage?.content?.includes('[CONTINUATION_PART_');
    
    if (isContinuation) {
      console.log("Detected continuation request, adding continuation header");
      requestBody._isContinuation = true;
      requestBody._continuationKey = apiKey; // Use the same key for continuation requests
    }
    
    // Enhanced headers with more browser-like values
    const headers = {
      ...getProxyHeaders(apiKey),
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'X-Client-Timestamp': clientTimestamp.toString(),
      'X-Continuation': isContinuation ? 'true' : 'false'
    };
    
    // Try multiple times with exponential backoff
    let attempts = 0;
    const maxAttempts = 3;
    let lastError: Error | null = null;
    
    while (attempts < maxAttempts) {
      try {
        const proxyResponse = await fetch(LOCAL_PROXY, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
          signal: controller.signal,
          credentials: 'include' // Send cookies if any, helpful for some proxy setups
        });
        
        if (proxyResponse.ok) {
          console.log("Proxy request successful with status:", proxyResponse.status);
          clearTimeout(timeoutId);
          return await proxyResponse.json();
        }
        
        console.warn(`Proxy request failed with status: ${proxyResponse.status} (attempt ${attempts + 1}/${maxAttempts})`);
        
        // Handle specific error codes
        if (proxyResponse.status === 401) {
          clearTimeout(timeoutId);
          throw new Error("API authentication failed - check your API key");
        } else if (proxyResponse.status === 403) {
          clearTimeout(timeoutId);
          throw new Error("API access forbidden - check your account permissions");
        } else if (proxyResponse.status === 429) {
          clearTimeout(timeoutId);
          throw new Error("API rate limit exceeded - please wait before trying again");
        } else if (proxyResponse.status >= 500) {
          // Server errors might be temporary - wait and retry
          const errorBody = await proxyResponse.text();
          console.warn("Server error response:", errorBody);
          lastError = new Error(`Proxy server error (${proxyResponse.status}): ${errorBody.substring(0, 100)}`);
        } else {
          // For other errors, try to get detailed information
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
          
          lastError = new Error(`Proxy request failed with status: ${proxyResponse.status}${errorText ? ` - ${errorText}` : ''}`);
          clearTimeout(timeoutId);
          throw lastError; // Non-retryable error
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.error("Proxy request timed out");
          lastError = new Error("Proxy request timed out - server may be overloaded");
          // Timeouts are retryable
        } else if (error instanceof TypeError && error.message.includes('fetch')) {
          console.error("Network error during proxy request - likely CORS or connectivity issue");
          lastError = new Error("Network error - check your internet connection and proxy configuration");
          // Network errors are retryable
        } else {
          // Other errors may not be retryable
          lastError = error instanceof Error ? error : new Error(String(error));
          clearTimeout(timeoutId);
          throw lastError;
        }
      }
      
      // Exponential backoff before retry
      const delay = Math.pow(2, attempts) * 1000 + Math.random() * 1000;
      console.log(`Retrying proxy request in ${delay}ms (attempt ${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      attempts++;
    }
    
    // If we've exhausted retries
    clearTimeout(timeoutId);
    throw lastError || new Error("Proxy request failed after multiple attempts");
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

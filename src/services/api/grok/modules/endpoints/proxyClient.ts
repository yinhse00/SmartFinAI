
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
    
    const proxyResponse = await fetch(LOCAL_PROXY, {
      method: 'POST',
      headers: getProxyHeaders(apiKey),
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

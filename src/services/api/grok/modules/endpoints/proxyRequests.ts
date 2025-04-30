
/**
 * Handler for proxy API requests
 */
import { LOCAL_PROXY, TIMEOUTS } from './constants';

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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Request-Source': 'browser-client', // Add custom header for tracking
        'X-Request-ID': `req-${Date.now()}` // Add request ID for tracing
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
      cache: 'no-store', // Prevent caching
      mode: 'cors' // Ensure CORS mode is explicitly set
    });
    
    clearTimeout(timeoutId);
    
    if (proxyResponse.ok) {
      // Check if response is JSON
      const contentType = proxyResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          console.log("Proxy request successful with status:", proxyResponse.status);
          const data = await proxyResponse.json();
          return data;
        } catch (jsonError) {
          console.error("Failed to parse JSON from proxy response:", jsonError);
          throw new Error("Invalid JSON response from proxy");
        }
      } else {
        // Handle HTML responses that sometimes come from proxies
        const text = await proxyResponse.text();
        const isHtmlResponse = text.includes('<!DOCTYPE html>') || text.includes('<html');
        
        console.warn(`Proxy endpoint returned ${isHtmlResponse ? 'HTML' : 'non-JSON'} response:`, text.substring(0, 100) + "...");
        throw new Error(isHtmlResponse 
          ? "Invalid response format from proxy - received HTML instead of JSON (possible CORS issue)" 
          : "Invalid response format from proxy - expected JSON");
      }
    }
    
    // Handle error responses by providing more context
    try {
      const errorText = await proxyResponse.text();
      console.warn(`Proxy request failed with status: ${proxyResponse.status}`, errorText.substring(0, 200));
      throw new Error(`Proxy request failed with status: ${proxyResponse.status} - ${errorText.substring(0, 100)}`);
    } catch (textError) {
      // If we can't read the error text, just use the status
      console.warn(`Proxy request failed with status: ${proxyResponse.status}`);
      throw new Error(`Proxy request failed with status: ${proxyResponse.status}`);
    }
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

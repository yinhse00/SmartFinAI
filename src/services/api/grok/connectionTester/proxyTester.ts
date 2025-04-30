
/**
 * Tests the local proxy connection
 */
import { LOCAL_PROXY_URL, TIMEOUTS } from './constants';

/**
 * Tests the local proxy endpoint
 * @param apiKey - The API key to use for testing
 * @returns Promise resolving to a boolean indicating whether the proxy connection was successful, 
 *          and additional details if successful
 */
export const testLocalProxy = async (apiKey: string): Promise<{
  success: boolean;
  message?: string;
  modelCount?: number;
}> => {
  try {
    console.log(`Testing local proxy endpoint: ${LOCAL_PROXY_URL}`);
    
    // Use AbortController for better timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn("Proxy request timed out after timeout period");
    }, TIMEOUTS.CONNECTION_TEST);
    
    const proxyResponse = await fetch(`${LOCAL_PROXY_URL}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Cache-Control': 'no-cache, no-store' // Prevent browser caching
      },
      signal: controller.signal,
      cache: 'no-store',
      mode: 'cors'
    });
    
    clearTimeout(timeoutId);
    
    if (proxyResponse.ok) {
      // Check if response is JSON
      const contentType = proxyResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const data = await proxyResponse.json();
          const modelCount = data?.data?.length || 0;
          
          console.log(`Local proxy connection successful, found ${modelCount} models`);
          return {
            success: true,
            message: `API connection successful via local proxy. Available models: ${modelCount}`,
            modelCount
          };
        } catch (jsonError) {
          console.warn("Proxy endpoint returned invalid JSON:", jsonError);
          return {
            success: false,
            message: "Proxy endpoint returned invalid JSON data"
          };
        }
      } else {
        // Handle HTML responses that sometimes come from proxies
        const text = await proxyResponse.text();
        const isHtmlResponse = text.includes('<!DOCTYPE html>') || text.includes('<html');
        
        console.warn(`Proxy endpoint returned ${isHtmlResponse ? 'HTML' : 'non-JSON'} response`);
        return {
          success: false,
          message: isHtmlResponse 
            ? "Proxy endpoint returned HTML instead of JSON (possible CORS issue)"
            : "Proxy endpoint returned invalid response format"
        };
      }
    } else {
      // Try to extract more error details
      let errorDetails = `Status: ${proxyResponse.status}`;
      try {
        const errorText = await proxyResponse.text();
        if (errorText && errorText.length < 100) {
          errorDetails += ` - ${errorText}`;
        }
      } catch (e) {
        // Ignore error reading response body
      }
      
      console.warn(`Proxy test failed with ${errorDetails}`);
      return {
        success: false,
        message: `Proxy test failed with ${errorDetails}`
      };
    }
  } catch (error) {
    // Provide better error messages for common issues
    let errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
      errorMessage = 'Network error: The proxy server may be unreachable or blocked by CORS policy';
    } else if (errorMessage.includes('aborted')) {
      errorMessage = 'Request timed out: The proxy server took too long to respond';
    }
    
    console.warn("Local proxy test failed:", errorMessage);
    return {
      success: false,
      message: errorMessage
    };
  }
};

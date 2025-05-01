
/**
 * Functions for testing local proxy API endpoints
 */

/**
 * Test the local API proxy with improved error handling
 */
export const testLocalProxy = async (apiKey: string): Promise<{
  success: boolean;
  message?: string;
}> => {
  try {
    console.log("Testing local proxy endpoint: /api/grok");
    
    // First check if the proxy endpoint is reachable at all
    try {
      await fetch('/api/grok/ping', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store'
      });
      
      console.log("Local proxy endpoint is reachable at basic level");
    } catch (basicError) {
      console.warn("Local proxy basic connectivity failed");
      return {
        success: false,
        message: "Local API proxy is not reachable"
      };
    }
    
    // Try a full models API call to verify proper functionality
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch('/api/grok/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Cache-Control': 'no-cache, no-store'
        },
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      
      // Check for non-JSON response that indicates an issue
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('text/html')) {
        const text = await response.text();
        
        if (text.includes('<!DOCTYPE html>') || 
            text.includes('<html') || 
            text.includes('</body>')) {
          console.warn("Proxy endpoint returned HTML response");
          return { 
            success: false,
            message: "Proxy endpoint returned HTML instead of JSON - possible CORS issue" 
          };
        }
      }
      
      // If response is OK and not HTML, it's likely good
      if (response.ok) {
        try {
          const data = await response.json();
          return {
            success: true,
            message: "Local proxy connection successful"
          };
        } catch (jsonError) {
          console.warn("Proxy returned invalid JSON:", jsonError);
          return {
            success: false,
            message: "Proxy returned invalid JSON response"
          };
        }
      } else {
        return {
          success: false,
          message: `Proxy returned error status: ${response.status}`
        };
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.warn("Fetch error during proxy test:", fetchError);
      
      const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
      const isCorsError = errorMessage.includes('CORS') || 
                        errorMessage.includes('cross-origin') ||
                        errorMessage.includes('Cross-Origin');
      
      return {
        success: false,
        message: isCorsError ? 
          "CORS policy restriction when accessing local proxy" : 
          `Error testing proxy: ${errorMessage}`
      };
    }
  } catch (error) {
    console.error("Proxy testing failed completely:", error);
    return {
      success: false,
      message: error instanceof Error ? 
        `Error testing local proxy: ${error.message}` : 
        "Unknown error testing local proxy"
    };
  }
};

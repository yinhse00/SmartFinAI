
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
      const data = await proxyResponse.json();
      const modelCount = data?.data?.length || 0;
      
      console.log(`Local proxy connection successful, found ${modelCount} models`);
      return {
        success: true,
        message: `API connection successful via local proxy. Available models: ${modelCount}`,
        modelCount
      };
    } else {
      console.warn(`Proxy test failed with status: ${proxyResponse.status}`);
      return {
        success: false,
        message: `Proxy test failed with status: ${proxyResponse.status}`
      };
    }
  } catch (error) {
    console.warn("Local proxy test failed:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
};

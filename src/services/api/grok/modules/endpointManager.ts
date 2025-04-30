
/**
 * Manages API endpoints and connection attempts with CORS mitigation
 */

// Local proxy endpoint - the single source of truth for all API calls
export const LOCAL_PROXY = '/api/grok/chat/completions';
export const LOCAL_PROXY_BASE = '/api/grok';

// No longer actively used for direct calls - kept for reference only
export const API_ENDPOINTS = [
  'https://api.grok.ai/v1/chat/completions',
  'https://grok-api.com/v1/chat/completions',
  'https://grok.x.ai/v1/chat/completions',
  'https://api.x.ai/v1/chat/completions'
];

/**
 * Primary API request function - Always uses local proxy to avoid CORS issues
 */
export const attemptProxyRequest = async (
  requestBody: any, 
  apiKey: string
): Promise<any> => {
  console.log("Making API call via local proxy at:", LOCAL_PROXY);
  
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
        'X-Request-Source': 'browser-client', 
        'X-Request-ID': `req-${Date.now()}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (proxyResponse.ok) {
      console.log("Proxy request successful with status:", proxyResponse.status);
      return await proxyResponse.json();
    }
    
    console.warn(`Proxy request failed with status: ${proxyResponse.status}`);
    throw new Error(`Proxy request failed with status: ${proxyResponse.status}`);
  } catch (error) {
    // Better error handling with specific messages for different error types
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error("Proxy request timed out");
      throw new Error("Proxy request timed out - server may be overloaded");
    } else if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error("Network error during proxy request");
      throw new Error("Network error - check your internet connection");
    }
    
    console.warn("Proxy request error:", error);
    throw error;
  }
};

/**
 * Removed direct API calls function that caused CORS issues
 * Now provides a fallback that still uses the proxy but with different parameters
 */
export const attemptFallbackProxyRequest = async (
  requestBody: any, 
  apiKey: string
): Promise<any> => {
  console.log("Attempting fallback proxy request with simplified parameters");
  
  try {
    // Create a simplified version of the request body
    const simplifiedBody = {
      ...requestBody,
      model: "grok-3-mini-beta", // Use lightweight model for fallback
      temperature: Math.min(requestBody.temperature || 0.7, 0.5), // Lower temperature
      max_tokens: Math.min(requestBody.max_tokens || 4000, 2000), // Fewer tokens
    };
    
    // Use the same proxy endpoint but with simplified parameters
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
    
    const fallbackResponse = await fetch(LOCAL_PROXY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Request-Source': 'browser-client-fallback',
        'X-Request-ID': `fallback-${Date.now()}`
      },
      body: JSON.stringify(simplifiedBody),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (fallbackResponse.ok) {
      console.log("Fallback proxy request successful");
      return await fallbackResponse.json();
    }
    
    throw new Error(`Fallback request failed with status: ${fallbackResponse.status}`);
  } catch (error) {
    console.error("All fallback attempts failed:", error);
    throw error;
  }
};

/**
 * Improved API availability check that exclusively uses the proxy
 */
export const checkApiAvailability = async (apiKey: string): Promise<boolean> => {
  if (!apiKey || !apiKey.startsWith('xai-')) {
    console.error("Invalid API key format for availability check");
    return false;
  }
  
  console.log("Checking Grok API availability via proxy...");
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const proxyResponse = await fetch(`${LOCAL_PROXY_BASE}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Request-Source': 'browser-client',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      const modelCount = data?.data?.length || 0;
      console.log(`API connection successful via proxy, found ${modelCount} models`);
      return true;
    }
    
    console.warn("API availability check failed with status:", proxyResponse.status);
    return false;
  } catch (e) {
    console.warn("API availability check failed:", e instanceof Error ? e.message : String(e));
    return false;
  }
};


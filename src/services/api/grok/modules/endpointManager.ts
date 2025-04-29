
/**
 * Manages API endpoints and connection attempts
 */

// Local proxy endpoint if available
export const LOCAL_PROXY = '/api/grok/chat/completions';

// Available API endpoints for direct calls
export const API_ENDPOINTS = [
  'https://api.grok.ai/v1/chat/completions',
  'https://grok-api.com/v1/chat/completions',
  'https://grok.x.ai/v1/chat/completions',
  'https://api.x.ai/v1/chat/completions'
];

/**
 * Attempt API call using local proxy
 */
export const attemptProxyRequest = async (
  requestBody: any, 
  apiKey: string
): Promise<any> => {
  console.log("Attempting API call via local proxy at:", LOCAL_PROXY);
  
  try {
    const proxyResponse = await fetch(LOCAL_PROXY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody),
      // Add timeout to avoid hanging requests
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });
    
    if (proxyResponse.ok) {
      return await proxyResponse.json();
    }
    
    console.warn(`Proxy request failed with status: ${proxyResponse.status}`);
    throw new Error(`Proxy request failed with status: ${proxyResponse.status}`);
  } catch (error) {
    console.warn("Proxy request error:", error);
    throw error;
  }
};

/**
 * Attempt direct API calls to various endpoints
 */
export const attemptDirectRequest = async (
  requestBody: any, 
  apiKey: string
): Promise<any> => {
  const errors: Error[] = [];
  
  for (const apiEndpoint of API_ENDPOINTS) {
    try {
      console.log(`Attempting direct API call to: ${apiEndpoint}`);
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Origin': window.location.origin
        },
        body: JSON.stringify(requestBody),
        mode: 'cors',
        // Add timeout to avoid hanging requests
        signal: AbortSignal.timeout(10000) // 10 second timeout for direct requests
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      console.warn(`Endpoint ${apiEndpoint} returned status: ${response.status}`);
      errors.push(new Error(`Status ${response.status} from ${apiEndpoint}`));
    } catch (endpointError) {
      console.warn(`Endpoint ${apiEndpoint} failed:`, endpointError);
      errors.push(endpointError instanceof Error ? endpointError : new Error(String(endpointError)));
      // Continue to next endpoint
    }
  }
  
  // If we get here, all endpoints failed
  const errorMessage = errors.map(e => e.message).join('; ');
  throw new Error(`All API endpoints failed: ${errorMessage}`);
};

// New function to check API availability without making a full request
export const checkApiAvailability = async (apiKey: string): Promise<boolean> => {
  try {
    // Try the proxy first (most likely to work)
    try {
      const proxyResponse = await fetch('/api/grok/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (proxyResponse.ok) {
        return true;
      }
    } catch (e) {
      console.warn("Proxy availability check failed:", e);
    }
    
    // Try direct endpoints
    for (const baseEndpoint of [
      'https://api.grok.ai',
      'https://grok-api.com',
      'https://grok.x.ai',
      'https://api.x.ai'
    ]) {
      try {
        const response = await fetch(`${baseEndpoint}/models`, {
          method: 'HEAD', // Use HEAD for faster checking
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
          mode: 'no-cors', // This will help bypass CORS for availability check
          signal: AbortSignal.timeout(3000) // 3 second timeout
        });
        
        // With no-cors, we can't check status, but if it doesn't throw, connection likely works
        return true;
      } catch (e) {
        // Continue trying other endpoints
      }
    }
    
    return false;
  } catch (e) {
    console.error("API availability check failed completely:", e);
    return false;
  }
};


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
  
  const proxyResponse = await fetch(LOCAL_PROXY, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });
  
  if (proxyResponse.ok) {
    return await proxyResponse.json();
  }
  
  console.warn(`Proxy request failed with status: ${proxyResponse.status}`);
  throw new Error(`Proxy request failed with status: ${proxyResponse.status}`);
};

/**
 * Attempt direct API calls to various endpoints
 */
export const attemptDirectRequest = async (
  requestBody: any, 
  apiKey: string
): Promise<any> => {
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
        mode: 'cors'
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      console.warn(`Endpoint ${apiEndpoint} returned status: ${response.status}`);
    } catch (endpointError) {
      console.warn(`Endpoint ${apiEndpoint} failed:`, endpointError);
      // Continue to next endpoint
    }
  }
  
  throw new Error('All API endpoints failed');
};

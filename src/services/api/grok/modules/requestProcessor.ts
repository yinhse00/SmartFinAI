
/**
 * Processes API requests with improved error handling and connectivity detection
 */
import { getOptimalEndpoint } from './endpointManager';
import { attemptProxyRequest } from './endpoints/proxyRequests';
import { attemptDirectRequest } from './endpoints/directRequests';

/**
 * Process an API request with intelligent endpoint selection and fallback
 */
export const processApiRequest = async (
  endpoint: string,
  method: string,
  body: any,
  apiKey: string
): Promise<any> => {
  // First determine the optimal endpoint strategy
  console.log("Determining optimal endpoint for API request");
  const optimalEndpoint = await getOptimalEndpoint(apiKey);
  
  if (!optimalEndpoint.isAvailable) {
    throw new Error("No available API endpoints - network connectivity issue");
  }
  
  // Customize the endpoint based on the selected strategy
  if (optimalEndpoint.endpointType === 'proxy') {
    // Use the proxy
    console.log("Using local proxy endpoint for request");
    const proxyEndpoint = `/api/grok${endpoint}`;
    return await attemptProxyRequest(proxyEndpoint, method, body, apiKey);
  } else {
    // Use direct endpoint, prioritizing api.x.ai which works in logs
    console.log(`Using direct endpoint ${optimalEndpoint.endpoint} for request`);
    return await attemptDirectRequest(
      `${optimalEndpoint.endpoint}${endpoint}`, 
      method, 
      body, 
      apiKey
    );
  }
};

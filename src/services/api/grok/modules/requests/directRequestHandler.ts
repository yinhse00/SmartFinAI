
/**
 * Handles direct API requests
 */
import { API_ENDPOINTS } from '../constants/apiEndpoints';

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
      
      // Use AbortController for better timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn(`Direct request to ${apiEndpoint} timed out after 20 seconds`);
      }, 20000); // 20 second timeout for direct requests
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Origin': window.location.origin,
          'X-Request-Source': 'browser-client', // Add custom header for tracking
          'X-Request-ID': `req-${Date.now()}` // Add request ID for tracing
        },
        body: JSON.stringify(requestBody),
        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`Direct API call to ${apiEndpoint} successful`);
        return await response.json();
      }
      
      console.warn(`Endpoint ${apiEndpoint} returned status: ${response.status}`);
      
      // Add more detailed error information
      let errorDetails = `Status ${response.status} from ${apiEndpoint}`;
      try {
        const errorData = await response.text();
        if (errorData) {
          errorDetails += ` - ${errorData}`;
        }
      } catch (e) {
        // Ignore error parsing errors
      }
      
      errors.push(new Error(errorDetails));
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

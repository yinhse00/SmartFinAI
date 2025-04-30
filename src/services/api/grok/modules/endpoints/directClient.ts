
/**
 * Client for making direct API requests to endpoints
 */
import { TIMEOUTS, getDirectHeaders } from './config';
import { getNextAvailableEndpoint, markEndpointAsFailing } from '../endpointRotator';

/**
 * Attempt direct API calls with endpoint rotation
 */
export const attemptDirectRequest = async (
  requestBody: any, 
  apiKey: string
): Promise<any> => {
  const errors: Error[] = [];
  let attemptCount = 0;
  const maxAttempts = 3;
  
  while (attemptCount < maxAttempts) {
    const endpoint = getNextAvailableEndpoint();
    attemptCount++;
    
    try {
      console.log(`Attempting direct API call to: ${endpoint} (attempt ${attemptCount}/${maxAttempts})`);
      
      // Use AbortController for better timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn(`Direct request to ${endpoint} timed out after 20 seconds`);
      }, TIMEOUTS.DIRECT_REQUEST);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: getDirectHeaders(apiKey),
        body: JSON.stringify(requestBody),
        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`Direct API call to ${endpoint} successful`);
        return await response.json();
      }
      
      console.warn(`Endpoint ${endpoint} returned status: ${response.status}`);
      markEndpointAsFailing(endpoint);
      
      // Add more detailed error information
      let errorDetails = `Status ${response.status} from ${endpoint}`;
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
      console.warn(`Endpoint ${endpoint} failed:`, endpointError);
      markEndpointAsFailing(endpoint);
      
      errors.push(endpointError instanceof Error ? endpointError : new Error(String(endpointError)));
      // Continue to next endpoint via the while loop
    }
  }
  
  // If we get here, all attempts failed
  const errorMessage = errors.map(e => e.message).join('; ');
  throw new Error(`All API endpoints failed after ${maxAttempts} attempts: ${errorMessage}`);
};

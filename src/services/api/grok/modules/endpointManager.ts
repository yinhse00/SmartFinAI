
/**
 * Manages API endpoints and connection attempts with improved resilience
 */

// Export all functionality from the modular files
export { LOCAL_PROXY, API_ENDPOINTS } from './endpoints/constants';
export { attemptProxyRequest } from './endpoints/proxyRequests';
export { attemptDirectRequest } from './endpoints/directRequests';
export { checkApiAvailability } from './endpoints/availabilityChecker';

// Add a new robust endpoint detection system that automatically adapts
import { checkApiAvailability } from './endpoints/availabilityChecker';

/**
 * Smart endpoint selection system that adapts to availability
 */
export const getOptimalEndpoint = async (apiKey: string): Promise<{
  isAvailable: boolean;
  endpointType: 'proxy' | 'direct' | 'none';
  endpoint?: string;
}> => {
  try {
    // Try checking API availability with more resilient approach
    const isApiAvailable = await checkApiAvailability(apiKey).catch(() => false);
    
    if (!isApiAvailable) {
      console.warn("All API endpoints appear to be unreachable");
      return { 
        isAvailable: false, 
        endpointType: 'none'
      };
    }
    
    // First try local proxy which is most reliable (avoids CORS)
    try {
      const proxyAvailable = await fetch('/api/grok/ping', {
        method: 'HEAD',
        headers: { 'Cache-Control': 'no-cache' },
        mode: 'no-cors' // Use no-cors to avoid preflight failures
      }).then(() => true).catch(() => false);
      
      if (proxyAvailable) {
        console.log("Local proxy appears to be available");
        return {
          isAvailable: true,
          endpointType: 'proxy',
          endpoint: '/api/grok'
        };
      }
    } catch (e) {
      console.warn("Failed to check local proxy:", e);
    }
    
    // If local proxy isn't available, find a working direct endpoint
    const directEndpoints = ['https://grok.x.ai', 'https://api.x.ai'];
    
    for (const endpoint of directEndpoints) {
      try {
        // Use a more reliable detection method
        const response = await fetch(`${endpoint}`, {
          method: 'HEAD',
          mode: 'no-cors', // Use no-cors to check basic connectivity
          cache: 'no-store'
        });
        
        console.log(`Endpoint ${endpoint} appears to be reachable`);
        return {
          isAvailable: true,
          endpointType: 'direct',
          endpoint
        };
      } catch (e) {
        console.warn(`Failed to connect to ${endpoint}:`, e);
      }
    }
    
    // No endpoints worked
    return { 
      isAvailable: false, 
      endpointType: 'none'
    };
    
  } catch (error) {
    console.error("Error in optimal endpoint detection:", error);
    return { 
      isAvailable: false, 
      endpointType: 'none'
    };
  }
};

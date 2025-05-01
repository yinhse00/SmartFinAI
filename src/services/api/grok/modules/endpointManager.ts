
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

// Cache for endpoint connections
let cachedEndpointConfig: {
  endpoint?: string;
  endpointType: 'proxy' | 'direct' | 'none';
  timestamp: number;
  isAvailable: boolean;
} | null = null;

// Cache timeout (5 minutes)
const CACHE_TIMEOUT = 5 * 60 * 1000;

/**
 * Smart endpoint selection system that adapts to availability
 */
export const getOptimalEndpoint = async (apiKey: string): Promise<{
  isAvailable: boolean;
  endpointType: 'proxy' | 'direct' | 'none';
  endpoint?: string;
}> => {
  try {
    // Check if we have a cached endpoint that's still valid
    const now = Date.now();
    if (cachedEndpointConfig && (now - cachedEndpointConfig.timestamp < CACHE_TIMEOUT) && cachedEndpointConfig.isAvailable) {
      console.log("Using cached endpoint configuration:", cachedEndpointConfig.endpointType);
      return {
        isAvailable: cachedEndpointConfig.isAvailable,
        endpointType: cachedEndpointConfig.endpointType,
        endpoint: cachedEndpointConfig.endpoint
      };
    }
    
    // Try checking API availability with more resilient approach
    const isApiAvailable = await checkApiAvailability(apiKey).catch(() => false);
    
    if (!isApiAvailable) {
      console.warn("All API endpoints appear to be unreachable");
      cachedEndpointConfig = {
        isAvailable: false,
        endpointType: 'none',
        timestamp: now
      };
      return { 
        isAvailable: false, 
        endpointType: 'none'
      };
    }
    
    // First try direct endpoints which appear to be working better
    // Based on logs analysis, prioritize api.x.ai which appears to be working
    const directEndpoints = ['https://api.x.ai', 'https://grok.x.ai', 'https://api.grok.ai'];
    
    // Try each endpoint with the focus on the one that works
    for (const endpoint of directEndpoints) {
      try {
        // Use more reliable detection with explicitly non-CORS request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${endpoint}/v1/models`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store'
          },
          signal: controller.signal,
          cache: 'no-store'
        }).catch(() => null);
        
        clearTimeout(timeoutId);
        
        if (response && response.ok) {
          console.log(`Direct endpoint ${endpoint} is confirmed to be working!`);
          cachedEndpointConfig = {
            isAvailable: true,
            endpointType: 'direct',
            endpoint,
            timestamp: now
          };
          return {
            isAvailable: true,
            endpointType: 'direct',
            endpoint
          };
        }
      } catch (endpointError) {
        console.warn(`API call to ${endpoint} failed:`, endpointError);
      }
    }
    
    // If direct endpoints fail, try local proxy which should work for CORS reasons
    try {
      // Using a more aggressive check for the proxy
      const proxyResponse = await fetch('/api/grok/ping', {
        method: 'GET',
        headers: { 
          'Cache-Control': 'no-cache',
          'X-Request-ID': `ping-${now}` // Add unique request ID to avoid caching
        },
        cache: 'no-store'
      });
      
      // If we get a response (even an error), the proxy is at least reachable
      const proxyAvailable = proxyResponse.status < 500; // Any status below 500 means server is responsive
      
      if (proxyAvailable) {
        console.log("Local proxy appears to be available");
        cachedEndpointConfig = {
          isAvailable: true,
          endpointType: 'proxy',
          endpoint: '/api/grok',
          timestamp: now
        };
        return {
          isAvailable: true,
          endpointType: 'proxy',
          endpoint: '/api/grok'
        };
      }
    } catch (e) {
      console.warn("Failed to check local proxy:", e);
    }
    
    // No endpoints worked
    cachedEndpointConfig = {
      isAvailable: false,
      endpointType: 'none',
      timestamp: now
    };
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

/**
 * Force clears any cached API connections to ensure fresh connection checks
 */
export const clearConnectionCache = (): void => {
  console.log("Clearing API connection cache");
  // Clear our internal cache
  cachedEndpointConfig = null;
  
  // Clear any potential cached fetch responses
  try {
    if ('caches' in window) {
      caches.delete('api-connection-cache').catch(e => console.warn("Cache clear failed:", e));
    }
    // Clear any localStorage cache entries
    localStorage.removeItem('api_endpoint_cache');
    localStorage.removeItem('last_connection_check');
    sessionStorage.removeItem('api_connection_status');
  } catch (e) {
    console.error("Error clearing connection cache:", e);
  }
};

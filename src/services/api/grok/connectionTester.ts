
/**
 * Functions for testing the Grok API connection
 */
import { getGrokApiKey } from '../../apiKeyService';

// List of endpoints to try
const API_ENDPOINTS = [
  '/api/grok/models',  // Local proxy
  'https://api.x.ai/v1/models',  // Direct API (likely blocked by CORS)
];

// Enhanced connection status tracking
let lastSuccessfulEndpoint = '';
let lastConnectionTime = 0;
let lastConnectionAttempt = 0;
let connectionSuccessCount = 0;
let connectionFailCount = 0;
const CONNECTION_CACHE_TIME = 60000; // 1 minute for standard cache
const CONNECTION_FAST_RETRY_TIME = 10000; // 10 seconds for quick retry after failure
const MAX_CACHE_TIME = 300000; // 5 minutes max cache time

// Background health check interval
let healthCheckInterval: number | null = null;

/**
 * Test the API connection with improved resilience
 */
export const connectionTester = {
  testApiConnection: async (providedApiKey?: string): Promise<{ success: boolean; message: string }> => {
    console.log('Testing Grok API connection...');
    
    // Use provided API key or get from storage
    const apiKey = providedApiKey || getGrokApiKey();
    if (!apiKey) {
      return { 
        success: false, 
        message: 'API key is not set. Please configure your API key in settings.'
      };
    }

    console.log('API key selected:', `using key ${apiKey ? '1' : '0'} of ${apiKey ? '1' : '0'} `);

    // Check if we have a recent successful connection
    const now = Date.now();
    
    // Use shorter cache time after failures for more responsive retry
    const effectiveCacheTime = connectionFailCount > 0 ? 
      CONNECTION_FAST_RETRY_TIME : 
      Math.min(CONNECTION_CACHE_TIME * (1 + connectionSuccessCount * 0.5), MAX_CACHE_TIME);
    
    if (lastSuccessfulEndpoint && (now - lastConnectionTime < effectiveCacheTime)) {
      console.log(`Using cached connection status (success) from ${lastSuccessfulEndpoint}, age: ${Math.round((now - lastConnectionTime) / 1000)}s`);
      return {
        success: true,
        message: `Connection verified (cached result from ${Math.round((now - lastConnectionTime) / 1000)}s ago)`
      };
    }

    // Update last attempt time
    lastConnectionAttempt = now;
    
    // Detect if we're in a browser environment for CORS handling
    const isBrowser = typeof window !== 'undefined';
    if (isBrowser) {
      console.log('Browser environment detected - testing with CORS preflight workarounds');
    }

    // Try all endpoints
    for (const endpoint of API_ENDPOINTS) {
      try {
        console.log(`Testing ${endpoint === '/api/grok/models' ? 'local proxy endpoint' : 'direct API endpoint'}: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store',
            'X-Request-Source': 'browser-client',
            'X-Cache-Bust': Date.now().toString()
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          // Check if the response contains models data
          if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
            console.log(`${endpoint === '/api/grok/models' ? 'Local proxy' : 'Direct API'} connection successful, found ${data.data.length} models`);
            
            // Update cache and stats
            lastSuccessfulEndpoint = endpoint;
            lastConnectionTime = now;
            connectionSuccessCount++;
            connectionFailCount = 0;
            
            // Validate the API key
            const keyValid = data.data.some((model: any) => model.id && (model.id.startsWith('grok') || model.id.includes('grok')));
            if (keyValid) {
              console.log('API key validation: Valid key found');
              
              // Set up background health check if not already running
              connectionTester.startBackgroundHealthCheck();
              
              return {
                success: true,
                message: `Connection successful. Found ${data.data.length} available models.`
              };
            } else {
              console.warn('API response received but no Grok models found');
              return {
                success: false,
                message: 'API connection established but no valid Grok models were found.'
              };
            }
          } else {
            console.warn('API response received but format unexpected');
            // This is a partial success - we got a response but not the expected format
            connectionFailCount++;
            return {
              success: false,
              message: 'API connection established but response format was unexpected.'
            };
          }
        } else {
          console.warn(`API endpoint ${endpoint} returned status ${response.status}`);
          // Continue trying other endpoints
        }
      } catch (error) {
        console.warn(`Error testing endpoint ${endpoint}:`, error);
        // Continue trying other endpoints
      }
    }

    // All endpoints failed
    connectionFailCount++;
    console.error('All API endpoints failed');
    return {
      success: false,
      message: 'Could not connect to any API endpoint. Please check your internet connection and API key.'
    };
  },
  
  /**
   * Test API key validity with specific validation
   */
  testApiKeyValidity: async (apiKey: string): Promise<{ isValid: boolean; message: string; quotaRemaining?: number }> => {
    if (!apiKey) {
      return { 
        isValid: false, 
        message: 'API key is empty. Please provide a valid API key.'
      };
    }

    // Check API key format - Grok API keys should start with 'xai-' prefix
    if (!apiKey.startsWith('xai-')) {
      return { 
        isValid: false, 
        message: 'Invalid API key format. Grok API keys should start with "xai-".'
      };
    }

    try {
      // Test connection using the provided key
      const connectionStatus = await connectionTester.testApiConnection(apiKey);
      
      if (connectionStatus.success) {
        // For successful connections, also check quota if possible
        let quotaRemaining: number | undefined;
        
        // Use the key that worked in the connection test
        const endpoint = lastSuccessfulEndpoint || API_ENDPOINTS[0];
        
        try {
          const quotaResponse = await fetch(`${endpoint.includes('/api/grok') ? '/api/grok/usage' : 'https://api.x.ai/v1/usage'}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Accept': 'application/json',
              'Cache-Control': 'no-cache, no-store'
            }
          });
          
          if (quotaResponse.ok) {
            const quotaData = await quotaResponse.json();
            if (quotaData && typeof quotaData.total_available === 'number') {
              quotaRemaining = quotaData.total_available;
            }
          }
        } catch (error) {
          console.warn('Failed to retrieve quota information:', error);
          // Continue without quota information
        }
        
        return {
          isValid: true,
          message: 'API key is valid and working properly',
          quotaRemaining
        };
      }
      
      return {
        isValid: false,
        message: connectionStatus.message || 'API key validation failed'
      };
    } catch (error) {
      console.error('Error validating API key:', error);
      return {
        isValid: false,
        message: error instanceof Error ? 
          `Error validating API key: ${error.message}` : 
          'Unknown error occurred while validating API key'
      };
    }
  },
  
  // Reset connection cache - enhanced with more aggressive clearing
  resetConnectionCache: () => {
    console.log('Forcefully resetting connection cache and endpoint status');
    lastSuccessfulEndpoint = '';
    lastConnectionTime = 0;
    lastConnectionAttempt = 0;
    
    // Reset stats but don't zero them completely to maintain some history
    connectionSuccessCount = Math.max(0, connectionSuccessCount - 3);
    connectionFailCount = Math.max(0, connectionFailCount - 2);
    
    // Clear any browser caches that might be affecting API requests
    if (typeof window !== 'undefined') {
      console.log('Clearing browser cache data for API endpoints');
      // Use more aggressive cache-clearing if available in the browser
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CLEAR_CACHE',
          patterns: ['/api/grok', 'api.x.ai']
        });
      }
    }
  },
  
  // Start a background health check
  startBackgroundHealthCheck: () => {
    if (healthCheckInterval) {
      return; // Already running
    }
    
    // Check every 2 minutes
    healthCheckInterval = window.setInterval(() => {
      const apiKey = getGrokApiKey();
      if (!apiKey) {
        return;
      }
      
      // Only do a health check if we haven't had a recent success
      const now = Date.now();
      if (now - lastConnectionTime > CONNECTION_CACHE_TIME && now - lastConnectionAttempt > CONNECTION_FAST_RETRY_TIME) {
        console.log('Running background health check for API connection');
        connectionTester.checkApiAvailability(apiKey).catch(() => {
          // Silent failure for background checks
        });
      }
    }, 120000); // 2 minutes
  },
  
  // Stop background health check
  stopBackgroundHealthCheck: () => {
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
      healthCheckInterval = null;
    }
  },
  
  // Enhanced API availability check with improved caching
  checkApiAvailability: async (apiKey: string): Promise<boolean> => {
    console.log('Checking Grok API availability...');
    
    // Use cached result if recent
    const now = Date.now();
    
    // Adaptive cache time based on recent success/failure ratio
    let cacheDuration = CONNECTION_CACHE_TIME;
    if (connectionFailCount > 0) {
      // Shorter cache time after failures to allow quicker recovery
      cacheDuration = CONNECTION_FAST_RETRY_TIME;
    } else if (connectionSuccessCount > 3) {
      // Longer cache time after multiple successes
      cacheDuration = Math.min(CONNECTION_CACHE_TIME * (1 + connectionSuccessCount * 0.2), MAX_CACHE_TIME);
    }
    
    if (lastSuccessfulEndpoint && (now - lastConnectionTime < cacheDuration)) {
      console.log(`Using cached API availability status (available) from ${lastSuccessfulEndpoint}`);
      return true;
    }
    
    // Try actual connection test
    try {
      const result = await connectionTester.testApiConnection(apiKey);
      return result.success;
    } catch (error) {
      console.error('Error checking API availability:', error);
      return false;
    }
  }
};

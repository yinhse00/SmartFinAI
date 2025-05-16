
/**
 * Functions for testing the Grok API connection
 */
import { getGrokApiKey } from '../../apiKeyService';
import { forceResetAllCircuitBreakers } from './modules/endpointManager';

// List of endpoints to try
const API_ENDPOINTS = [
  '/api/grok/models',  // Local proxy
  'https://api.x.ai/v1/models',  // Direct API (likely blocked by CORS)
];

// Track connection status
let lastSuccessfulEndpoint = '';
let lastConnectionTime = 0;
const CONNECTION_CACHE_TIME = 30000; // 30 seconds - reduced from 60000

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

    // Check if we have a recent successful connection - but with reduced cache time
    const now = Date.now();
    if (lastSuccessfulEndpoint && (now - lastConnectionTime < CONNECTION_CACHE_TIME)) {
      console.log(`Using cached connection status (success) from ${lastSuccessfulEndpoint}`);
      return {
        success: true,
        message: `Connection verified (cached result from ${Math.round((now - lastConnectionTime) / 1000)}s ago)`
      };
    }

    // Detect if we're in a browser environment for CORS handling
    const isBrowser = typeof window !== 'undefined';
    if (isBrowser) {
      console.log('Browser environment detected - testing with CORS preflight workarounds');
    }

    // Try all endpoints with aggressive cache-busting parameters
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
            'X-Cache-Bust': Date.now().toString(), // Add cache busting
            'Pragma': 'no-cache'
          },
          cache: 'no-store' // Force no caching
        });

        if (response.ok) {
          const data = await response.json();
          
          // Check if the response contains models data
          if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
            console.log(`${endpoint === '/api/grok/models' ? 'Local proxy' : 'Direct API'} connection successful, found ${data.data.length} models`);
            
            // Update cache
            lastSuccessfulEndpoint = endpoint;
            lastConnectionTime = now;
            
            // Force reset all circuit breakers on successful connection
            forceResetAllCircuitBreakers();
            
            // Validate the API key
            const keyValid = data.data.some(model => model.id && (
              model.id.startsWith('grok') || 
              model.id.includes('grok')
            ));
            
            if (keyValid) {
              console.log('API key validation: Valid key found');
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

    // All endpoints failed - try forcing a circuit breaker reset
    console.error('All API endpoints failed, forcing circuit breaker reset');
    forceResetAllCircuitBreakers();
    
    return {
      success: false,
      message: 'Could not connect to any API endpoint. Please check your internet connection and API key.'
    };
  },
  
  // Reset connection cache - enhanced with more aggressive clearing
  resetConnectionCache: () => {
    console.log('Forcefully resetting connection cache and endpoint status');
    lastSuccessfulEndpoint = '';
    lastConnectionTime = 0;
    
    // Clear any browser caches that might be affecting API requests
    if (typeof caches !== 'undefined') {
      try {
        caches.keys().then(names => {
          names.forEach(name => {
            console.log(`Attempting to delete cache: ${name}`);
            caches.delete(name);
          });
        });
      } catch (e) {
        console.warn('Unable to clear browser caches:', e);
      }
    }
    
    // Clear localStorage cache entries if any
    if (typeof localStorage !== 'undefined') {
      try {
        const cacheKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('cache') || key.includes('api') || key.includes('grok'))) {
            if (!key.includes('GROK_API_KEY')) { // Don't remove the API key itself
              cacheKeys.push(key);
            }
          }
        }
        
        cacheKeys.forEach(key => {
          console.log(`Removing cache-related localStorage entry: ${key}`);
          localStorage.removeItem(key);
        });
      } catch (e) {
        console.warn('Unable to clear localStorage caches:', e);
      }
    }
  },
  
  // Check if API is available without full testing
  checkApiAvailability: async (apiKey: string): Promise<boolean> => {
    console.log('Checking Grok API availability...');
    
    // Use cached result if available
    const now = Date.now();
    if (lastSuccessfulEndpoint && (now - lastConnectionTime < CONNECTION_CACHE_TIME)) {
      console.log(`Using cached API availability status (available) from ${lastSuccessfulEndpoint}`);
      return true;
    }
    
    // Try the preferred endpoint first (local proxy)
    try {
      console.log(`Testing local proxy endpoint: /api/grok`);
      const response = await fetch('/api/grok/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          // Add cache busting header to force a fresh request
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Force-Fresh': Date.now().toString()
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.data && Array.isArray(data.data)) {
          console.log(`Local proxy connection successful, found ${data.data.length} models`);
          lastSuccessfulEndpoint = '/api/grok/models';
          lastConnectionTime = now;
          return true;
        }
      }
    } catch (error) {
      console.warn('Local proxy endpoint check failed:', error);
    }
    
    return false;
  },
  
  // Add the missing testApiKeyValidity function
  testApiKeyValidity: async (apiKey: string): Promise<{ 
    isValid: boolean; 
    message: string;
    quotaRemaining?: number;
  }> => {
    console.log('Testing API key validity...');
    
    if (!apiKey || apiKey.trim() === '') {
      return {
        isValid: false,
        message: 'API key cannot be empty'
      };
    }
    
    // Basic format validation for Grok API keys
    if (!apiKey.startsWith('xai-') || apiKey.length < 20) {
      return {
        isValid: false,
        message: 'Invalid API key format. Grok API keys typically start with "xai-"'
      };
    }
    
    // Test actual connection using the key
    try {
      const connectionResult = await connectionTester.testApiConnection(apiKey);
      
      if (connectionResult.success) {
        // Here we could add quota lookup if the API supports it
        return {
          isValid: true,
          message: 'API key is valid and connection is successful',
          quotaRemaining: undefined  // Can be implemented if API provides quota info
        };
      } else {
        return {
          isValid: false,
          message: `API key validation failed: ${connectionResult.message}`
        };
      }
    } catch (error) {
      console.error('Error validating API key:', error);
      return {
        isValid: false,
        message: error instanceof Error ? 
          `Error validating API key: ${error.message}` : 
          'Unknown error occurred during API key validation'
      };
    }
  }
};

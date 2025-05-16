
/**
 * Functions for testing the Grok API connection
 */
import { getGrokApiKey } from '../../apiKeyService';

// List of endpoints to try
const API_ENDPOINTS = [
  '/api/grok/models',  // Local proxy
  'https://api.x.ai/v1/models',  // Direct API (likely blocked by CORS)
];

// Track connection status
let lastSuccessfulEndpoint = '';
let lastConnectionTime = 0;
const CONNECTION_CACHE_TIME = 60000; // 1 minute

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
            'X-Request-Source': 'browser-client'
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          // Check if the response contains models data
          if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
            console.log(`${endpoint === '/api/grok/models' ? 'Local proxy' : 'Direct API'} connection successful, found ${data.data.length} models`);
            
            // Update cache
            lastSuccessfulEndpoint = endpoint;
            lastConnectionTime = now;
            
            // Validate the API key
            const keyValid = data.data.some(model => model.id && model.id.startsWith('grok'));
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

    // All endpoints failed
    console.error('All API endpoints failed');
    return {
      success: false,
      message: 'Could not connect to any API endpoint. Please check your internet connection and API key.'
    };
  },
  
  // Reset connection cache
  resetConnectionCache: () => {
    lastSuccessfulEndpoint = '';
    lastConnectionTime = 0;
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
          'Authorization': `Bearer ${apiKey}`
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
  }
};

/**
 * Manages API endpoints and circuit breakers
 */
import { getGrokApiKey } from '../../../apiKeyService';
import { connectionTester } from '../connectionTester';

// Circuit breaker pattern to avoid repeatedly hitting failing endpoints
const circuitBreakers: {
  [endpoint: string]: {
    failures: number,
    lastFailure: number,
    isOpen: boolean
  }
} = {};

// Max failures before circuit opens
const FAILURE_THRESHOLD = 3;
// Time in ms before attempting to close circuit again
const RESET_TIMEOUT = 60000; // 1 minute

// Proxy endpoint
const PROXY_ENDPOINT = '/api/grok';

// Reset circuit breaker for a specific endpoint
const resetCircuitBreaker = (endpoint: string) => {
  if (circuitBreakers[endpoint]) {
    circuitBreakers[endpoint].failures = 0;
    circuitBreakers[endpoint].isOpen = false;
    circuitBreakers[endpoint].lastFailure = 0;
    console.log(`Reset circuit breaker for ${endpoint}`);
  }
};

/**
 * Force reset all circuit breakers
 */
export const forceResetAllCircuitBreakers = () => {
  console.log('Forcing reset of all circuit breakers');
  
  // Reset all known circuit breakers
  Object.keys(circuitBreakers).forEach(endpoint => {
    resetCircuitBreaker(endpoint);
  });
  
  // Clear any unknown circuit breakers by recreating the object
  for (const key in circuitBreakers) {
    delete circuitBreakers[key];
  }
  
  // Also reset connection cache
  connectionTester.resetConnectionCache();
  
  // Clear any fetch-related browser caches if in browser environment
  if (typeof window !== 'undefined' && window.fetch) {
    const originalFetch = window.fetch;
    
    // Temporarily override fetch to include cache-busting for next few requests
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      if (typeof input === 'string' && (input.includes('/api/grok') || input.includes('api.x.ai'))) {
        // Add cache-busting for ALL API requests, not just proxy ones
        const bustCache = init?.headers ? { ...init.headers, 'Cache-Control': 'no-cache, no-store', 'X-Cache-Bust': Date.now().toString() } : { 'Cache-Control': 'no-cache, no-store', 'X-Cache-Bust': Date.now().toString() };
        init = init ? { ...init, headers: bustCache, cache: 'no-store' } : { headers: bustCache, cache: 'no-store' };
      }
      return originalFetch(input, init);
    };
    
    // Restore original fetch after 5 seconds
    setTimeout(() => {
      window.fetch = originalFetch;
    }, 5000);
  }
  
  // Force a new connection test after reset
  setTimeout(() => {
    connectionTester.testApiConnection().then(result => {
      console.log('Post-reset connection test:', result);
    });
  }, 500);
  
  console.log('Circuit breaker reset complete with cache and fetch resets');
  return true; // Return success value
};

/**
 * Attempt request via proxy
 */
export const attemptProxyRequest = async (requestBody: any, apiKey: string) => {
  const endpoint = `${PROXY_ENDPOINT}/chat/completions`;
  
  // Check if circuit breaker is open for this endpoint
  if (circuitBreakers[endpoint]?.isOpen) {
    const timeSinceFailure = Date.now() - circuitBreakers[endpoint].lastFailure;
    if (timeSinceFailure < RESET_TIMEOUT) {
      throw new Error(`Circuit breaker open for ${endpoint}`);
    } else {
      // Reset circuit breaker after timeout
      resetCircuitBreaker(endpoint);
    }
  }
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      // Handle HTTP errors
      const errorText = await response.text();
      // Update circuit breaker
      incrementCircuitBreakerFailures(endpoint);
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    // Reset circuit breaker on success
    resetCircuitBreaker(endpoint);
    return data;
  } catch (error) {
    // Update circuit breaker
    incrementCircuitBreakerFailures(endpoint);
    throw error;
  }
};

/**
 * Attempt request directly to API
 * Note: This will likely be blocked by CORS in browser environments
 */
export const attemptDirectRequest = async (requestBody: any, apiKey: string) => {
  const endpoint = 'https://api.x.ai/v1/chat/completions';
  
  // Check if circuit breaker is open for this endpoint
  if (circuitBreakers[endpoint]?.isOpen) {
    const timeSinceFailure = Date.now() - circuitBreakers[endpoint].lastFailure;
    if (timeSinceFailure < RESET_TIMEOUT) {
      throw new Error(`Circuit breaker open for ${endpoint}`);
    } else {
      // Reset circuit breaker after timeout
      resetCircuitBreaker(endpoint);
    }
  }
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      // Handle HTTP errors
      const errorText = await response.text();
      // Update circuit breaker
      incrementCircuitBreakerFailures(endpoint);
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    // Reset circuit breaker on success
    resetCircuitBreaker(endpoint);
    return data;
  } catch (error) {
    // Update circuit breaker
    incrementCircuitBreakerFailures(endpoint);
    throw error;
  }
};

/**
 * Increment failures for circuit breaker
 */
const incrementCircuitBreakerFailures = (endpoint: string) => {
  if (!circuitBreakers[endpoint]) {
    circuitBreakers[endpoint] = {
      failures: 0,
      lastFailure: 0,
      isOpen: false
    };
  }
  
  circuitBreakers[endpoint].failures += 1;
  circuitBreakers[endpoint].lastFailure = Date.now();
  
  // Open circuit breaker if threshold is reached
  if (circuitBreakers[endpoint].failures >= FAILURE_THRESHOLD) {
    circuitBreakers[endpoint].isOpen = true;
    console.log(`Circuit breaker opened for ${endpoint} after ${FAILURE_THRESHOLD} failures`);
  }
};

/**
 * Check API availability
 */
export const checkApiAvailability = async (apiKey: string): Promise<boolean> => {
  return await connectionTester.checkApiAvailability(apiKey);
};


/**
 * Manages API endpoints and circuit breakers
 */
import { getGrokApiKey } from '../../../apiKeyService';
import { connectionTester } from '../connectionTester';

// Enhanced circuit breaker with adaptive thresholds
const circuitBreakers: {
  [endpoint: string]: {
    failures: number,
    lastFailure: number,
    isOpen: boolean,
    documentType?: string, // Track document type for specialized thresholds
    consecutiveSuccesses: number, // Track successes for auto-healing
    lastSuccess: number,
    totalAttempts: number,
    lastReset?: number // Track when the circuit was last reset
  }
} = {};

// Adaptive thresholds based on document types - INCREASED for better resilience
const getFailureThreshold = (documentType?: string): number => {
  // Word and Excel files may have more complex processing needs
  if (documentType === 'Word' || documentType === 'Excel') {
    return 8; // Increased from 4 to 8 for complex documents
  }
  return 5; // Increased from 3 to 5 for other requests
};

// Dynamic reset timeout with progressive backoff - INCREASED base timeout
const getResetTimeout = (failures: number): number => {
  const baseTimeout = 60000; // Increased from 30s to 60s base
  const maxTimeout = 300000; // 5 minutes max (unchanged)
  // Exponential backoff with cap
  const calculatedTimeout = Math.min(baseTimeout * Math.pow(1.5, failures - 1), maxTimeout);
  return calculatedTimeout;
};

// Proxy endpoint
const PROXY_ENDPOINT = '/api/grok';

// Time threshold for automatic periodic reset attempts (20 minutes)
const AUTO_RESET_THRESHOLD = 20 * 60 * 1000;

/**
 * Reset circuit breaker for a specific endpoint
 */
const resetCircuitBreaker = (endpoint: string) => {
  if (circuitBreakers[endpoint]) {
    circuitBreakers[endpoint].failures = 0;
    circuitBreakers[endpoint].isOpen = false;
    circuitBreakers[endpoint].lastFailure = 0;
    circuitBreakers[endpoint].consecutiveSuccesses = 0;
    circuitBreakers[endpoint].lastReset = Date.now();
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
      if (typeof input === 'string' && input.includes('/api/grok')) {
        // Add cache-busting for API requests
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
  
  console.log('Circuit breaker reset complete with cache and fetch resets');
};

/**
 * Check if a circuit needs auto-healing based on time elapsed
 */
const checkAutoHealCircuit = (endpoint: string): boolean => {
  if (!circuitBreakers[endpoint] || !circuitBreakers[endpoint].isOpen) {
    return false;
  }
  
  const now = Date.now();
  const lastFailure = circuitBreakers[endpoint].lastFailure;
  const failures = circuitBreakers[endpoint].failures;
  const resetTimeout = getResetTimeout(failures);
  
  // Auto-heal based on time since last failure
  if (now - lastFailure > resetTimeout) {
    console.log(`Auto-healing circuit for ${endpoint} after ${(now - lastFailure) / 1000}s`);
    circuitBreakers[endpoint].isOpen = false;
    // Don't fully reset - keep track of past issues but allow new attempts
    circuitBreakers[endpoint].consecutiveSuccesses = 0;
    return true;
  }
  
  // Also check for periodic reset for document endpoints that have been open too long
  const documentType = circuitBreakers[endpoint].documentType;
  const lastReset = circuitBreakers[endpoint].lastReset || 0;
  
  if (documentType && (now - lastReset > AUTO_RESET_THRESHOLD)) {
    console.log(`Attempting periodic reset for document endpoint ${endpoint} after ${(now - lastReset) / 1000}s`);
    circuitBreakers[endpoint].isOpen = false;
    circuitBreakers[endpoint].lastReset = now;
    // Reduce failure count but don't reset completely to maintain some history
    circuitBreakers[endpoint].failures = Math.max(1, Math.floor(circuitBreakers[endpoint].failures / 2));
    return true;
  }
  
  return false;
};

/**
 * Record a successful API call to help with circuit healing
 */
const recordSuccess = (endpoint: string): void => {
  if (!circuitBreakers[endpoint]) {
    circuitBreakers[endpoint] = {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
      consecutiveSuccesses: 1,
      lastSuccess: Date.now(),
      totalAttempts: 1,
      lastReset: Date.now()
    };
    return;
  }
  
  circuitBreakers[endpoint].consecutiveSuccesses += 1;
  circuitBreakers[endpoint].lastSuccess = Date.now();
  circuitBreakers[endpoint].totalAttempts += 1;
  
  // If we have enough consecutive successes, start healing the circuit
  // Changed from 2 to 1 for faster recovery
  if (circuitBreakers[endpoint].isOpen && circuitBreakers[endpoint].consecutiveSuccesses >= 1) {
    console.log(`Healing circuit for ${endpoint} after ${circuitBreakers[endpoint].consecutiveSuccesses} consecutive success`);
    resetCircuitBreaker(endpoint);
  }
};

/**
 * Attempt request via proxy
 */
export const attemptProxyRequest = async (requestBody: any, apiKey: string, documentType?: string) => {
  const endpoint = `${PROXY_ENDPOINT}/chat/completions`;
  
  // Update circuit breaker with document type if provided
  if (documentType && circuitBreakers[endpoint]) {
    circuitBreakers[endpoint].documentType = documentType;
  }
  
  // Check if circuit breaker is open for this endpoint
  if (circuitBreakers[endpoint]?.isOpen) {
    // Check if we should auto-heal this circuit
    if (!checkAutoHealCircuit(endpoint)) {
      throw new Error(`Circuit breaker open for ${endpoint}`);
    }
    // Circuit was auto-healed, continue with the request
  }
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Cache-Control': 'no-cache, no-store',
        'X-Request-Type': documentType || 'standard',
        'X-Cache-Bust': Date.now().toString()
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      // Handle HTTP errors
      const errorText = await response.text();
      // Update circuit breaker
      incrementCircuitBreakerFailures(endpoint, documentType);
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    // Record success to help heal circuit breakers
    recordSuccess(endpoint);
    return data;
  } catch (error) {
    // Update circuit breaker
    incrementCircuitBreakerFailures(endpoint, documentType);
    throw error;
  }
};

/**
 * Attempt request directly to API
 * Note: This will likely be blocked by CORS in browser environments
 */
export const attemptDirectRequest = async (requestBody: any, apiKey: string, documentType?: string) => {
  const endpoint = 'https://api.x.ai/v1/chat/completions';
  
  // Update circuit breaker with document type if provided
  if (documentType && circuitBreakers[endpoint]) {
    circuitBreakers[endpoint].documentType = documentType;
  }
  
  // Check if circuit breaker is open for this endpoint
  if (circuitBreakers[endpoint]?.isOpen) {
    // Check if we should auto-heal this circuit
    if (!checkAutoHealCircuit(endpoint)) {
      throw new Error(`Circuit breaker open for ${endpoint}`);
    }
    // Circuit was auto-healed, continue with the request
  }
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Cache-Control': 'no-cache, no-store',
        'X-Request-Type': documentType || 'standard',
        'X-Cache-Bust': Date.now().toString()
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      // Handle HTTP errors
      const errorText = await response.text();
      // Update circuit breaker
      incrementCircuitBreakerFailures(endpoint, documentType);
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    // Record success to help heal circuit breakers
    recordSuccess(endpoint);
    return data;
  } catch (error) {
    // Update circuit breaker
    incrementCircuitBreakerFailures(endpoint, documentType);
    throw error;
  }
};

/**
 * Increment failures for circuit breaker with adaptive thresholds
 */
const incrementCircuitBreakerFailures = (endpoint: string, documentType?: string) => {
  if (!circuitBreakers[endpoint]) {
    circuitBreakers[endpoint] = {
      failures: 1,
      lastFailure: Date.now(),
      isOpen: false,
      documentType,
      consecutiveSuccesses: 0,
      lastSuccess: 0,
      totalAttempts: 1,
      lastReset: Date.now()
    };
  } else {
    circuitBreakers[endpoint].failures += 1;
    circuitBreakers[endpoint].lastFailure = Date.now();
    circuitBreakers[endpoint].documentType = documentType || circuitBreakers[endpoint].documentType;
    circuitBreakers[endpoint].consecutiveSuccesses = 0;
    circuitBreakers[endpoint].totalAttempts += 1;
  }
  
  const threshold = getFailureThreshold(circuitBreakers[endpoint].documentType);
  
  // Open circuit breaker if threshold is reached
  if (circuitBreakers[endpoint].failures >= threshold) {
    circuitBreakers[endpoint].isOpen = true;
    console.log(`Circuit breaker opened for ${endpoint} after ${circuitBreakers[endpoint].failures} failures. Document type: ${circuitBreakers[endpoint].documentType || 'standard'}`);
  }
};

/**
 * Check API availability with enhanced caching and auto-retry
 */
export const checkApiAvailability = async (apiKey: string): Promise<boolean> => {
  return await connectionTester.checkApiAvailability(apiKey);
};


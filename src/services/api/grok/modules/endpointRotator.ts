
/**
 * Endpoint rotation and fallback mechanism
 * This module cycles through available endpoints if one fails
 */

// List of available API endpoints with priority order
export const ENDPOINT_OPTIONS = [
  'https://api.grok.ai/v1/chat/completions',
  'https://grok.x.ai/v1/chat/completions',
  'https://api.x.ai/v1/chat/completions',
  'https://grok-api.com/v1/chat/completions'
];

// Track which endpoints are currently failing
const failingEndpoints = new Map<string, number>();

// Clear failing endpoints after cooldown period
const ENDPOINT_COOLDOWN = 5 * 60 * 1000; // 5 minutes

/**
 * Get the next available endpoint that hasn't failed recently
 */
export const getNextAvailableEndpoint = (): string => {
  // Clean up old failing endpoints
  cleanupFailingEndpoints();
  
  // Find first endpoint that's not currently marked as failing
  for (const endpoint of ENDPOINT_OPTIONS) {
    if (!failingEndpoints.has(endpoint)) {
      console.log(`Using API endpoint: ${endpoint}`);
      return endpoint;
    }
  }
  
  // If all endpoints are failing, use the least recently failed one
  console.warn("All endpoints marked as failing, using least recently failed one");
  let oldestFailureTime = Date.now();
  let leastRecentlyFailedEndpoint = ENDPOINT_OPTIONS[0];
  
  failingEndpoints.forEach((timestamp, endpoint) => {
    if (timestamp < oldestFailureTime) {
      oldestFailureTime = timestamp;
      leastRecentlyFailedEndpoint = endpoint;
    }
  });
  
  console.log(`Using least recently failed endpoint: ${leastRecentlyFailedEndpoint}`);
  return leastRecentlyFailedEndpoint;
};

/**
 * Mark an endpoint as failing
 */
export const markEndpointAsFailing = (endpoint: string): void => {
  failingEndpoints.set(endpoint, Date.now());
  console.warn(`Marked endpoint as failing: ${endpoint}`);
};

/**
 * Clean up failing endpoints that have cooled down
 */
const cleanupFailingEndpoints = (): void => {
  const now = Date.now();
  
  failingEndpoints.forEach((timestamp, endpoint) => {
    if (now - timestamp > ENDPOINT_COOLDOWN) {
      failingEndpoints.delete(endpoint);
      console.log(`Cleared failing status for endpoint: ${endpoint}`);
    }
  });
};

/**
 * Check if all endpoints are marked as failing
 */
export const areAllEndpointsFailing = (): boolean => {
  cleanupFailingEndpoints();
  return failingEndpoints.size >= ENDPOINT_OPTIONS.length;
};

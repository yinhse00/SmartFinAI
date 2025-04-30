
/**
 * Constants used for API connection testing
 */

// List of potential API endpoints to test
export const TEST_ENDPOINTS = [
  'https://api.grok.ai',
  'https://grok-api.com',
  'https://grok.x.ai',
  'https://api.x.ai'
];

// Local proxy endpoint for testing
export const LOCAL_PROXY_URL = '/api/grok';

// Timeout values (in milliseconds)
export const TIMEOUTS = {
  CONNECTION_TEST: 8000,  // 8 seconds
  API_REQUEST: 10000      // 10 seconds
};


/**
 * API endpoint configuration and constants
 */

// Local proxy endpoint if available
export const LOCAL_PROXY = '/api/grok/chat/completions';

// Available API endpoints for direct calls
export const API_ENDPOINTS = [
  'https://api.grok.ai/v1/chat/completions',
  'https://grok-api.com/v1/chat/completions',
  'https://grok.x.ai/v1/chat/completions',
  'https://api.x.ai/v1/chat/completions'
];

// Base endpoints for availability checks
export const BASE_ENDPOINTS = [
  'https://api.grok.ai',
  'https://grok-api.com',
  'https://grok.x.ai',
  'https://api.x.ai'
];

// Request timeouts (in milliseconds)
export const TIMEOUTS = {
  PROXY_REQUEST: 30000,   // 30 second timeout
  DIRECT_REQUEST: 20000,  // 20 second timeout
  AVAILABILITY_CHECK: 8000, // 8 second timeout
  ENDPOINT_CHECK: 5000    // 5 second timeout for individual endpoints
};

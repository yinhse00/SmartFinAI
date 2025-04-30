
/**
 * API endpoint configuration
 */

// Local proxy endpoint
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

// Timeout configurations
export const TIMEOUTS = {
  PROXY_REQUEST: 30000, // 30 second timeout
  DIRECT_REQUEST: 20000, // 20 second timeout
  AVAILABILITY_CHECK: 8000, // 8 second timeout
  NO_CORS_CHECK: 5000 // 5 second timeout
};

// Headers for proxy requests
export const getProxyHeaders = (apiKey: string) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${apiKey}`,
  'X-Request-Source': 'browser-client',
  'X-Request-ID': `req-${Date.now()}`,
  'Accept': 'application/json'
});

// Headers for direct requests
export const getDirectHeaders = (apiKey: string) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${apiKey}`,
  'Origin': window.location.origin,
  'X-Request-Source': 'browser-client',
  'X-Request-ID': `req-${Date.now()}`
});

// CORS headers for response
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Financial-Expert, X-Long-Response'
};

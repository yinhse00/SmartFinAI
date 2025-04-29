
/**
 * API endpoint constants
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

// Base API endpoints for availability checks
export const BASE_ENDPOINTS = [
  'https://api.grok.ai',
  'https://grok-api.com',
  'https://grok.x.ai',
  'https://api.x.ai'
];

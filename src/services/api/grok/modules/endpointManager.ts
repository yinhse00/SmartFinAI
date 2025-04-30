
/**
 * Manages API endpoints and connection attempts
 */
import { attemptProxyRequest } from './endpoints/proxyClient';
import { attemptDirectRequest } from './endpoints/directClient';
import { checkApiAvailability } from './endpoints/availabilityChecker';
import { LOCAL_PROXY, API_ENDPOINTS, BASE_ENDPOINTS } from './endpoints/config';

// Re-export everything for backward compatibility
export {
  attemptProxyRequest,
  attemptDirectRequest,
  checkApiAvailability,
  LOCAL_PROXY,
  API_ENDPOINTS,
  BASE_ENDPOINTS
};

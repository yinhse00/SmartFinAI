
/**
 * Manages API endpoints and connection attempts
 */
import { LOCAL_PROXY, API_ENDPOINTS } from './constants/apiEndpoints';
import { attemptProxyRequest } from './requests/proxyRequestHandler';
import { attemptDirectRequest } from './requests/directRequestHandler';
import { checkApiAvailability } from './availability/availabilityChecker';

export {
  LOCAL_PROXY,
  API_ENDPOINTS,
  attemptProxyRequest,
  attemptDirectRequest,
  checkApiAvailability
};

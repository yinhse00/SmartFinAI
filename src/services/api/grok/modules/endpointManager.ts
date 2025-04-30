
/**
 * Manages API endpoints and connection attempts
 */

// Export all functionality from the new modular files
export { LOCAL_PROXY, API_ENDPOINTS } from './endpoints/constants';
export { attemptProxyRequest } from './endpoints/proxyRequests';
export { attemptDirectRequest } from './endpoints/directRequests';
export { checkApiAvailability } from './endpoints/availabilityChecker';

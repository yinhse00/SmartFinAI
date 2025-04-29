
/**
 * Entry point for API connection testing functionality
 */
import { testApiConnection } from './modules/testing/connectionChecker';
import { testApiKeyValidity } from './modules/testing/keyValidator';

/**
 * Enhanced API connection tester with improved diagnostics and fallback mechanisms
 */
export const connectionTester = {
  testApiConnection,
  testApiKeyValidity
};

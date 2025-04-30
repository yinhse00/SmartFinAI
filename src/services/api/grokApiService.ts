
import { connectionTester } from './grok/connectionTester';
import { apiClient } from './grok/apiClient';
import { offlineResponseGenerator } from './grok/offlineResponseGenerator';

// Version identifier for debugging
const API_VERSION = '2.2.0';

export const grokApiService = {
  testApiConnection: connectionTester.testApiConnection,
  callChatCompletions: async (requestBody: any, providedApiKey?: string) => {
    // Add version information to all requests
    const enhancedRequestBody = {
      ...requestBody,
      apiVersion: API_VERSION,
      environmentConsistency: true,
      useStableParameters: true
    };
    return await apiClient.callChatCompletions(enhancedRequestBody, providedApiKey);
  },
  generateOfflineResponseFormat: offlineResponseGenerator.generateOfflineResponseFormat,
  version: API_VERSION
};

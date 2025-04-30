
import { connectionTester } from './grok/connectionTester';
import { apiClient } from './grok/apiClient';
import { offlineResponseGenerator } from './grok/offlineResponseGenerator';

export const grokApiService = {
  testApiConnection: connectionTester.testApiConnection,
  testApiKeyValidity: connectionTester.testApiKeyValidity,
  callChatCompletions: apiClient.callChatCompletions,
  generateOfflineResponseFormat: offlineResponseGenerator.generateOfflineResponseFormat
};

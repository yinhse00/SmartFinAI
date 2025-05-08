
import { connectionTester } from './grok/connectionTester';
import { apiClient } from './grok/apiClient';
import { offlineResponseGenerator } from './grok/offlineResponseGenerator';

export const grokApiService = {
  testApiConnection: connectionTester.testApiConnection,
  callChatCompletions: apiClient.callChatCompletions,
  generateOfflineResponseFormat: offlineResponseGenerator.generateOfflineResponseFormat,
  
  // Add the missing getRegulatoryContext method
  getRegulatoryContext: async (query: string, hasRegulatoryDatabase: boolean, metadata?: any) => {
    try {
      // Call the API via the existing chat completions method
      const model = metadata?.model || 'grok-3-mini-beta';
      const response = await apiClient.callChatCompletions({
        messages: [
          {
            role: 'system',
            content: 'You are a regulatory context retrieval system.'
          },
          {
            role: 'user',
            content: `Retrieve relevant context for: ${query}`
          }
        ],
        model: model,
        temperature: 0.1,
        stream: false,
        metadata: metadata
      });
      
      return response?.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error('Error in grokApiService.getRegulatoryContext:', error);
      return '';
    }
  }
};

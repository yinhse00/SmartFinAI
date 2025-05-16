
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
        metadata: metadata
      });
      
      return response?.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error('Error in grokApiService.getRegulatoryContext:', error);
      return '';
    }
  },
  
  // New method for enhanced query classification
  classifyFinancialQuery: async (query: string): Promise<any> => {
    try {
      const response = await apiClient.callChatCompletions({
        messages: [
          {
            role: 'system',
            content: 'You are a financial query classification system. Classify queries into relevant regulatory categories.'
          },
          {
            role: 'user',
            content: `Classify this financial query and return a structured JSON response: ${query}`
          }
        ],
        model: 'grok-3-beta', // Using more capable model for classification
        temperature: 0.2,
        metadata: {
          processingStage: 'classification'
        }
      });
      
      try {
        // Try to parse the JSON response
        const content = response?.choices?.[0]?.message?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'Failed to parse classification' };
      } catch (jsonError) {
        console.error('Error parsing classification:', jsonError);
        return { error: 'Invalid classification format' };
      }
    } catch (error) {
      console.error('Error in grokApiService.classifyFinancialQuery:', error);
      return { error: 'Classification service error' };
    }
  }
};


import { connectionTester } from './grok/connectionTester';
import { apiClient } from './grok/apiClient';
import { offlineResponseGenerator } from './grok/offlineResponseGenerator';

export const grokApiService = {
  testApiConnection: connectionTester.testApiConnection,
  callChatCompletions: apiClient.callChatCompletions,
  generateOfflineResponseFormat: offlineResponseGenerator.generateOfflineResponseFormat,
  
  // Enhanced getRegulatoryContext method
  getRegulatoryContext: async (query: string, hasRegulatoryDatabase: boolean, metadata?: any) => {
    try {
      // Build an enhanced system prompt that instructs Grok to use its knowledge
      const systemPrompt = `
      You are a Hong Kong financial regulatory information retrieval system specializing in HKEX Listing Rules, 
      Takeovers Code, and related regulations. Provide accurate, comprehensive information about Hong Kong financial 
      regulations based on your knowledge database.
      
      If the query relates to IFA (Independent Financial Adviser) requirements, include:
      - When IFAs are required and when they are not
      - Proper rule references (e.g., Rules 14.06, 13.84, 14A.44, 14A.45)
      - Clear distinctions between different types of transactions
      
      If the query relates to the Takeovers Code, include:
      - Relevant Code provisions and Practice Notes
      - SFC requirements and procedures
      - Mandatory versus voluntary offer distinctions
      
      Provide specific rule numbers whenever possible and structure information clearly.
      `;
      
      // Call the API via the existing chat completions method
      const model = metadata?.model || 'grok-3-beta'; // Using more capable model by default
      const response = await apiClient.callChatCompletions({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Provide comprehensive regulatory information for this query: ${query}`
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

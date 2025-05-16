
import { connectionTester } from './grok/connectionTester';
import { apiClient } from './grok/apiClient';
import { offlineResponseGenerator } from './grok/offlineResponseGenerator';

export const grokApiService = {
  testApiConnection: connectionTester.testApiConnection,
  callChatCompletions: apiClient.callChatCompletions,
  generateOfflineResponseFormat: offlineResponseGenerator.generateOfflineResponseFormat,
  
  // Enhanced getRegulatoryContext method with faster response times
  getRegulatoryContext: async (query: string, _hasRegulatoryDatabase: boolean = false, metadata?: any) => {
    try {
      // Optimized system prompt for faster, more accurate responses
      const systemPrompt = `
      You are a Hong Kong financial regulatory expert specializing in HKEX Listing Rules, 
      Takeovers Code, and related regulations. Provide accurate, concise information using your 
      built-in knowledge. Focus on precision and brevity.
      
      If the query relates to specific rules (IFA, Takeovers, etc.):
      - Cite specific rule references (e.g., Rules 14.06, 13.84)
      - Explain key requirements concisely
      - Highlight practical implications
      
      IMPORTANT: Be direct and minimize unnecessary explanation.
      `;
      
      // Use mini model for faster responses by default, upgrade when needed
      const model = metadata?.specializedQuery ? 'grok-3-beta' : 'grok-3-mini-beta';
      
      // Streamlined API call with optimized parameters
      const response = await apiClient.callChatCompletions({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Provide concise regulatory information: ${query}` }
        ],
        model: model,
        temperature: 0.1, // Lower temperature for more consistent, predictable responses
        max_tokens: metadata?.specializedQuery ? 2000 : 1000, // Reduced token limit for faster responses
        metadata: metadata
      });
      
      return response?.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error('Error in grokApiService.getRegulatoryContext:', error);
      return '';
    }
  },
  
  // Streamlined query classification method
  classifyFinancialQuery: async (query: string): Promise<any> => {
    try {
      const response = await apiClient.callChatCompletions({
        messages: [
          {
            role: 'system',
            content: 'Classify financial queries into categories. Be brief and concise.'
          },
          {
            role: 'user',
            content: `Classify: ${query}`
          }
        ],
        model: 'grok-3-mini-beta',
        temperature: 0.1,
        max_tokens: 300, // Significantly reduced for faster classification
        metadata: {
          processingStage: 'classification'
        }
      });
      
      try {
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

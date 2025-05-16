
import { connectionTester } from './grok/connectionTester';
import { apiClient } from './grok/apiClient';
import { offlineResponseGenerator } from './grok/offlineResponseGenerator';

export const grokApiService = {
  testApiConnection: connectionTester.testApiConnection,
  callChatCompletions: apiClient.callChatCompletions,
  generateOfflineResponseFormat: offlineResponseGenerator.generateOfflineResponseFormat,
  
  // Enhanced getRegulatoryContext method with quality-focused responses
  getRegulatoryContext: async (query: string, _hasRegulatoryDatabase: boolean = false, metadata?: any) => {
    try {
      // Quality-focused system prompt for comprehensive responses with improved paragraph formatting
      const systemPrompt = `
      You are a Hong Kong financial regulatory expert specializing in HKEX Listing Rules, 
      Takeovers Code, and related regulations. Provide accurate, comprehensive information using your 
      built-in knowledge. Focus on accuracy, thoroughness, and relevance.
      
      If the query relates to specific rules (IFA, Takeovers, etc.):
      - Cite specific rule references (e.g., Rules 14.06, 13.84)
      - Explain key requirements thoroughly
      - Highlight practical implications with examples where appropriate
      - Include relevant cross-references to other rules when pertinent
      - Explain the regulatory purpose behind the requirements when relevant
      
      FORMAT YOUR RESPONSES:
      • Use paragraphs to separate different points or ideas
      • Start each new idea or concept with a new paragraph for clarity
      • Use **bold text** for important concepts and key terms
      • Use *italic text* for emphasis or special terms
      
      When using bullet points:
      • Start each bullet point on a new line
      • Ensure adequate spacing before and after bullet point lists
      • Each bullet point should represent a complete thought
      • Use proper indentation for sub-points if needed
      
      • Use tables for structured information like timetables and comparison of requirements
      • Ensure proper spacing between paragraphs and bullet points for readability
      
      Ensure your response is complete, accurate, and provides the user with all relevant information.
      `;
      
      // Smart model selection based on query complexity
      const isComplexQuery = query.length > 150 || 
        query.toLowerCase().includes('timetable') ||
        query.toLowerCase().includes('rights issue') ||
        query.toLowerCase().includes('connected transaction') ||
        query.toLowerCase().includes('takeovers code') ||
        metadata?.specializedQuery;
      
      const model = isComplexQuery || metadata?.specializedQuery ? 'grok-3-beta' : 'grok-3-mini-beta';
      
      // Enhanced API call with quality-optimized parameters
      const response = await apiClient.callChatCompletions({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Provide comprehensive regulatory information: ${query}` }
        ],
        model: model,
        temperature: metadata?.specializedQuery ? 0.3 : 0.5, // Balanced temperature for better quality
        max_tokens: isComplexQuery ? 25000 : 15000, // Higher token limits for comprehensive responses
        metadata: {
          ...metadata,
          isUserFacingQuery: false,
          internalProcessing: true
        }
      });
      
      return response?.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error('Error in grokApiService.getRegulatoryContext:', error);
      return '';
    }
  },
  
  // Enhanced query classification method
  classifyFinancialQuery: async (query: string): Promise<any> => {
    try {
      const response = await apiClient.callChatCompletions({
        messages: [
          {
            role: 'system',
            content: 'Classify financial queries into detailed categories. Provide comprehensive classification.'
          },
          {
            role: 'user',
            content: `Classify: ${query}`
          }
        ],
        model: 'grok-3-mini-beta', // Use mini model for internal classification to save costs
        temperature: 0.3,
        max_tokens: 1000, // Sufficient for classification
        metadata: {
          processingStage: 'classification',
          internalProcessing: true
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

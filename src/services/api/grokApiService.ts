
import { connectionTester } from './grok/connectionTester';
import { apiClient } from './grok/apiClient';
import { offlineResponseGenerator } from './grok/offlineResponseGenerator';
import { GROK_MODELS } from '@/config/grokModels';

// Context cache implementation
const contextCache = new Map<string, {
  context: string;
  timestamp: number;
  category?: string;
}>();

// Cache expiration (15 minutes)
const CONTEXT_CACHE_EXPIRATION = 15 * 60 * 1000;

export const grokApiService = {
  testApiConnection: connectionTester.testApiConnection,
  callChatCompletions: apiClient.callChatCompletions,
  generateOfflineResponseFormat: offlineResponseGenerator.generateOfflineResponseFormat,
  
  // Enhanced getRegulatoryContext method with quality-focused responses
  getRegulatoryContext: async (query: string, _hasRegulatoryDatabase: boolean = false, metadata?: any) => {
    try {
      // Check cache first
      const cacheKey = query.toLowerCase().substring(0, 100);
      const cachedContext = contextCache.get(cacheKey);
      
      if (cachedContext && (Date.now() - cachedContext.timestamp < CONTEXT_CACHE_EXPIRATION)) {
        console.log('Using cached regulatory context');
        return cachedContext.context;
      }
      
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
      
      // OPTIMIZATION: Always use primary model to maintain quality
      const model = GROK_MODELS.PRIMARY;
      
      // Enhanced API call with quality-optimized parameters
      const response = await apiClient.callChatCompletions({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Provide comprehensive regulatory information: ${query}` }
        ],
        model: model,
        temperature: 0.5, // Balanced temperature for better quality
        max_tokens: 25000, // Higher token limits for comprehensive responses
        metadata: {
          ...metadata
        }
      });
      
      const contextContent = response?.choices?.[0]?.message?.content || '';
      
      // Cache the result
      if (contextContent) {
        contextCache.set(cacheKey, {
          context: contextContent,
          timestamp: Date.now(),
          category: metadata?.category
        });
        
        // Limit cache size
        if (contextCache.size > 30) {
          const oldestKey = Array.from(contextCache.keys())[0];
          contextCache.delete(oldestKey);
        }
      }
      
      return contextContent;
    } catch (error) {
      console.error('Error in grokApiService.getRegulatoryContext:', error);
      return '';
    }
  },
  
  // Enhanced query classification method - also using full model
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
        model: GROK_MODELS.PRIMARY, // OPTIMIZATION: Use full model for classification
        temperature: 0.3,
        max_tokens: 1000, // Sufficient for classification
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
  },
  
  // Flush context cache - useful for testing and debugging
  flushContextCache: () => {
    contextCache.clear();
    console.log('Context cache flushed');
  }
};

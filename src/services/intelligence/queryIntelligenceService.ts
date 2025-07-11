import { grokApiService } from '../api/grokApiService';

export interface QueryAnalysis {
  categories: string[];
  targetParty: 'listed_companies' | 'new_listing_applicants' | 'both';
  intent: 'faq' | 'rules' | 'process' | 'costs' | 'timetable' | 'documentation' | 'general';
  relevantTables: string[];
  keywords: string[];
  confidence: number;
}

export interface AiSearchStrategy {
  prioritizedTables: string[];
  keywords: string[];
  reasoning: string;
  intent: 'faq' | 'rules' | 'process' | 'costs' | 'timetable' | 'documentation' | 'general';
  categories: string[];
}

/**
 * Service for analyzing queries using Grok 3 to determine optimal search strategy
 */
export const queryIntelligenceService = {
  /**
   * Analyze a query using Grok 3 to determine search strategy
   */
  analyzeQuery: async (query: string): Promise<QueryAnalysis> => {
    try {
      console.log('Analyzing query with Grok 3:', query);
      
      const systemPrompt = `You are a Hong Kong financial regulatory query analyzer. Analyze the user query and return a JSON object with the following structure:

{
  "categories": ["rules", "provision", "index", "timetable", "documentation", "estimated_expenses", "checklist"],
  "targetParty": "listed_companies" | "new_listing_applicants" | "both",
  "intent": "faq" | "rules" | "process" | "costs" | "timetable" | "documentation" | "general",
  "relevantTables": ["table_names_from_search_index"],
  "keywords": ["extracted_keywords"],
  "confidence": 0.8
}

Target party detection:
- "new_listing_applicants" for IPO, new listing, listing application queries
- "listed_companies" for continuing obligations, listed issuer queries  
- "both" when unclear or applies to both

Return ONLY the JSON object, no other text.`;

      const response = await grokApiService.callChatCompletions({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this query: ${query}` }
        ],
        model: 'grok-4-0709',
        temperature: 0.2,
        max_tokens: 800,
        metadata: { processingStage: 'query_analysis' }
      });

      const content = response?.choices?.[0]?.message?.content || '';
      let analysis: QueryAnalysis;

      try {
        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : '{}';
        analysis = JSON.parse(jsonStr);
        
        // Validate and provide defaults
        analysis = {
          categories: analysis.categories || ['general'],
          targetParty: analysis.targetParty || 'both',
          intent: analysis.intent || 'general',
          relevantTables: analysis.relevantTables || [],
          keywords: analysis.keywords || [],
          confidence: analysis.confidence || 0.7
        };
        
      } catch (parseError) {
        console.error('Error parsing query analysis:', parseError);
        // Fallback analysis based on simple keyword detection
        analysis = queryIntelligenceService.createFallbackAnalysis(query);
      }

      console.log('Query analysis result:', analysis);
      return analysis;
      
    } catch (error) {
      console.error('Error in query analysis:', error);
      return queryIntelligenceService.createFallbackAnalysis(query);
    }
  },

  /**
   * Use AI to determine a search strategy based on query and content previews.
   */
  getAiSearchStrategy: async (
    query: string, 
    searchIndexPreviews: Record<string, string>,
    searchFocus?: 'takeovers' | 'listing_rules'
  ): Promise<AiSearchStrategy> => {
    try {
      console.log('Determining AI-driven search strategy for query:', query);
      
      let focusInstruction = '';
      if (searchFocus === 'takeovers') {
        focusInstruction = 'The query is known to be related to the Takeovers Code. Prioritize tables related to takeovers, general offers, and related documents.';
      } else if (searchFocus === 'listing_rules') {
        focusInstruction = 'The query is known to be related to Listing Rules. Prioritize tables related to listing rules, guidance letters, and FAQs.';
      }

      const systemPrompt = `You are an expert search strategist for a Hong Kong financial regulatory database. Your task is to analyze a user query and previews of content from various database tables to determine the most effective search strategy.
${focusInstruction}

The user is asking: "${query}"

Here are content previews from available tables:
${JSON.stringify(searchIndexPreviews, null, 2)}

Based on the user query and the content previews, return a JSON object with the following structure:
{
  "prioritizedTables": ["table_name_1", "table_name_2", ...],
  "keywords": ["relevant_keyword_1", "keyword_2", ...],
  "reasoning": "A brief explanation of why you chose these tables and in this order.",
  "intent": "faq" | "rules" | "process" | "costs" | "timetable" | "documentation" | "general",
  "categories": ["rules", "provision", "index", "timetable", "documentation", "estimated_expenses", "checklist"]
}

Instructions:
1.  **Prioritize Tables**: List the table names in the order they should be searched. Only include tables that are highly relevant. If a table preview shows no relevance, do not include it.
2.  **Extract Keywords**: Identify the most important keywords from the user query.
3.  **Provide Reasoning**: Briefly explain your logic.
4.  **Determine Intent and Categories**: Classify the query's intent and relevant categories.

Return ONLY the JSON object, no other text.`;

      const response = await grokApiService.callChatCompletions({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze the query "${query}" and provide a search strategy.` }
        ],
        model: 'grok-4-0709',
        temperature: 0.1,
        max_tokens: 1200,
        metadata: { processingStage: 'ai_search_strategy' }
      });

      const content = response?.choices?.[0]?.message?.content || '';
      let strategy: AiSearchStrategy;

      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : '{}';
        const parsed = JSON.parse(jsonStr);
        
        strategy = {
          prioritizedTables: parsed.prioritizedTables || [],
          keywords: parsed.keywords || [],
          reasoning: parsed.reasoning || 'No reasoning provided by AI.',
          intent: parsed.intent || 'general',
          categories: parsed.categories || ['general'],
        };
        
      } catch (parseError) {
        console.error('Error parsing AI search strategy:', parseError);
        strategy = {
          prioritizedTables: Object.keys(searchIndexPreviews),
          keywords: query.split(' ').filter(word => word.length > 3),
          reasoning: 'AI strategy parsing failed, falling back to basic keyword search across all tables.',
          intent: 'general',
          categories: ['general'],
        };
      }

      console.log('AI search strategy result:', strategy);
      return strategy;
      
    } catch (error) {
      console.error('Error in AI search strategy analysis:', error);
      return {
        prioritizedTables: Object.keys(searchIndexPreviews),
        keywords: query.split(' ').filter(word => word.length > 3),
        reasoning: 'Error during AI strategy generation, falling back to basic search.',
        intent: 'general',
        categories: ['general'],
      };
    }
  },

  /**
   * Create fallback analysis when Grok analysis fails
   */
  createFallbackAnalysis: (query: string): QueryAnalysis => {
    const lowerQuery = query.toLowerCase();
    
    // Detect target party
    let targetParty: 'listed_companies' | 'new_listing_applicants' | 'both' = 'both';
    if (lowerQuery.includes('new listing') || lowerQuery.includes('ipo') || lowerQuery.includes('listing application')) {
      targetParty = 'new_listing_applicants';
    } else if (lowerQuery.includes('listed issuer') || lowerQuery.includes('continuing obligation')) {
      targetParty = 'listed_companies';
    }
    
    // Detect intent
    let intent: QueryAnalysis['intent'] = 'general';
    if (lowerQuery.includes('faq') || lowerQuery.includes('question')) {
      intent = 'faq';
    } else if (lowerQuery.includes('cost') || lowerQuery.includes('fee')) {
      intent = 'costs';
    } else if (lowerQuery.includes('timetable') || lowerQuery.includes('timeline')) {
      intent = 'timetable';
    } else if (lowerQuery.includes('process') || lowerQuery.includes('procedure')) {
      intent = 'process';
    } else if (lowerQuery.includes('document') || lowerQuery.includes('form')) {
      intent = 'documentation';
    }
    
    // Fallback no longer suggests hardcoded tables.
    const relevantTables: string[] = [];
    
    return {
      categories: [intent === 'general' ? 'rules' : intent],
      targetParty,
      intent,
      relevantTables,
      keywords: query.split(' ').filter(word => word.length > 2),
      confidence: 0.6
    };
  }
};

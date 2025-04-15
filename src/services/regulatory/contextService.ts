
import { databaseService } from '../databaseService';

/**
 * Financial regulatory context service - specialized for Hong Kong corporate finance
 */
export const contextService = {
  /**
   * Enhanced regulatory context retrieval with specialized financial semantic search
   */
  getRegulatoryContextWithReasoning: async (query: string) => {
    try {
      console.group('Retrieving Specialized Financial Context');
      console.log('Original Query:', query);
      
      // Specialized query processing for financial terms
      const financialTerms = extractFinancialTerms(query);
      console.log('Identified Financial Terms:', financialTerms);
      
      // Perform advanced search across the financial database with priority search terms
      const searchResults = await databaseService.search(query, 'listing_rules');
      console.log(`Found ${searchResults.length} primary results from listing rules`);
      
      // Secondary search in other categories if needed
      let secondaryResults = [];
      if (searchResults.length < 2) {
        secondaryResults = await databaseService.search(query);
        console.log(`Found ${secondaryResults.length} additional results from broader search`);
      }
      
      // Combine and prioritize results with financial relevance scoring
      const allResults = [...searchResults, ...secondaryResults];
      const prioritizedResults = prioritizeByRelevance(allResults, financialTerms);
      
      // Format context with section headings and regulatory citations
      const context = prioritizedResults
        .map(entry => `[${entry.title} | ${entry.source}]:\n${entry.content}`)
        .join('\n\n---\n\n');
      
      // Generate reasoning that explains why these specific regulations are relevant
      const reasoning = generateContextReasoning(prioritizedResults, query, financialTerms);
      
      console.log('Context Length:', context.length);
      console.log('Reasoning:', reasoning);
      console.groupEnd();
      
      return {
        context: context || 'No specific Hong Kong financial regulatory information found.',
        reasoning: reasoning
      };
    } catch (error) {
      console.error('Error retrieving specialized financial context:', error);
      return {
        context: 'Error fetching financial regulatory context',
        reasoning: 'Unable to search specialized financial database due to an unexpected error.'
      };
    }
  },

  /**
   * Get regulatory context for a given financial query
   */
  getRegulatoryContext: async (query: string): Promise<string> => {
    try {
      console.log('Basic Financial Context Search:', query);
      
      // Perform a search across the database with financial terms prioritization
      const searchResults = await databaseService.search(query, 'listing_rules');
      
      // If no results, try a broader search with financial terms extraction
      const fallbackResults = searchResults.length === 0 
        ? await databaseService.search(extractFinancialTerms(query).join(' ')) 
        : searchResults;
      
      // Combine and format results with Hong Kong regulatory citations
      const context = fallbackResults
        .map(entry => `[${entry.title} | ${entry.source}]:\n${entry.content}`)
        .join('\n\n---\n\n');
      
      return context || 'No specific Hong Kong financial regulatory information found.';
    } catch (error) {
      console.error('Error retrieving financial regulatory context:', error);
      return 'Error fetching Hong Kong financial regulatory context';
    }
  }
};

/**
 * Extract financial and regulatory terms from a query
 */
function extractFinancialTerms(query: string): string[] {
  const financialTerms = [
    'listing rules', 'rights issue', 'takeovers code', 'connected transaction',
    'mandatory offer', 'disclosure', 'prospectus', 'SFC', 'HKEX', 'offering',
    'waiver', 'circular', 'public float', 'placing', 'subscription', 'underwriting'
  ];
  
  const foundTerms = financialTerms.filter(term => 
    query.toLowerCase().includes(term.toLowerCase())
  );
  
  return foundTerms.length > 0 ? foundTerms : [query];
}

/**
 * Prioritize search results based on relevance to financial terms
 */
function prioritizeByRelevance(results: any[], financialTerms: string[]): any[] {
  return results.sort((a, b) => {
    const aRelevance = calculateRelevance(a, financialTerms);
    const bRelevance = calculateRelevance(b, financialTerms);
    return bRelevance - aRelevance;
  });
}

/**
 * Calculate relevance score of a result to financial terms
 */
function calculateRelevance(result: any, financialTerms: string[]): number {
  let score = 0;
  
  // Score based on matches in title and content
  financialTerms.forEach(term => {
    if (result.title.toLowerCase().includes(term.toLowerCase())) score += 3;
    if (result.content.toLowerCase().includes(term.toLowerCase())) score += 1;
  });
  
  // Bonus for listing rules and regulatory categories
  if (result.category === 'listing_rules') score += 2;
  if (result.category === 'takeovers') score += 2;
  
  return score;
}

/**
 * Generate reasoning for why specific context was selected
 */
function generateContextReasoning(results: any[], query: string, financialTerms: string[]): string {
  if (results.length === 0) {
    return 'No relevant Hong Kong financial regulatory information found for this query.';
  }
  
  const categoryCount: Record<string, number> = {};
  results.forEach(result => {
    categoryCount[result.category] = (categoryCount[result.category] || 0) + 1;
  });
  
  const mainCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat);
  
  const matchedTerms = financialTerms.length ? 
    `financial terms (${financialTerms.join(', ')})` : 
    'general financial context';
  
  return `Found ${results.length} relevant Hong Kong financial document(s) matching ${matchedTerms}. Primary sources include ${mainCategories.join(', ')} regulations.`;
}

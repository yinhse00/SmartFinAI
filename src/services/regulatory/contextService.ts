
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
      
      // Fix: Convert to lowercase and include both singular and plural forms
      const normalizedQuery = query.toLowerCase()
        .replace('right issue', 'rights issue')  // Common typo fix
        .replace('rights issues', 'rights issue') // Normalize plural form
        .replace('right issues', 'rights issue'); // Another common typo
      
      // First try an exact search in listing rules category
      let searchResults = await databaseService.search(normalizedQuery, 'listing_rules');
      console.log(`Found ${searchResults.length} primary results from exact search in listing rules`);
      
      // If no results, try searching with extracted financial terms
      if (searchResults.length === 0 || searchResults.length < 2) {
        const financialTermsQuery = financialTerms.join(' ');
        const termResults = await databaseService.search(financialTermsQuery, 'listing_rules');
        console.log(`Found ${termResults.length} results using financial terms in listing rules`);
        
        // Combine results if we found some with terms
        if (termResults.length > 0) {
          searchResults = [...searchResults, ...termResults];
        }
      }
      
      // If still no results or few results, do a keyword search with key financial terms
      if (searchResults.length === 0 || searchResults.length < 2) {
        // Check if query contains timetable references
        if (query.toLowerCase().includes('timetable') || 
            query.toLowerCase().includes('schedule') || 
            query.toLowerCase().includes('timeline')) {
          // Special handling for timetable requests - always include rights issue timetable info
          const timetableResults = await databaseService.search('rights issue timetable', 'listing_rules');
          console.log(`Found ${timetableResults.length} results using 'rights issue timetable' keyword`);
          searchResults = [...searchResults, ...timetableResults];
        } else {
          // General financial term search across all categories
          const generalResults = await databaseService.search(financialTerms[0] || normalizedQuery);
          console.log(`Found ${generalResults.length} results from broad search`);
          searchResults = [...searchResults, ...generalResults];
        }
      }
      
      // Ensure we have unique results
      const uniqueResults = removeDuplicateResults(searchResults);
      
      // Combine and prioritize results with financial relevance scoring
      const prioritizedResults = prioritizeByRelevance(uniqueResults, financialTerms);
      
      // Special case for rights issue timetables - ensure we have at least basic information
      if (query.toLowerCase().includes('rights issue') && 
          (query.toLowerCase().includes('timetable') || 
           query.toLowerCase().includes('schedule') ||
           query.toLowerCase().includes('timeline')) &&
          prioritizedResults.length < 2) {
        console.log("Enhancing timetable context with fallback information");
        prioritizedResults.push({
          title: "Rights Issue Timetable",
          source: "Listing Rules Chapter 10",
          content: "Rights issue timetables typically follow a structured timeline from announcement to dealing day. Key dates include record date, PAL dispatch, rights trading period, and acceptance deadline.",
          category: "listing_rules"
        });
      }
      
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
      
      // Normalize query to handle common variations
      const normalizedQuery = query.toLowerCase()
        .replace('right issue', 'rights issue')
        .replace('rights issues', 'rights issue');
      
      // Perform a search across the database with financial terms prioritization
      let searchResults = await databaseService.search(normalizedQuery, 'listing_rules');
      
      // If no results, try keyword search
      if (searchResults.length === 0) {
        const financialTerms = extractFinancialTerms(query);
        if (query.toLowerCase().includes('timetable') || query.toLowerCase().includes('schedule')) {
          searchResults = await databaseService.search('rights issue timetable');
        } else {
          searchResults = await databaseService.search(financialTerms.join(' '));
        }
      }
      
      // Combine and format results with Hong Kong regulatory citations
      const context = searchResults
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
    'listing rules', 'rights issue', 'right issue', 'takeovers code', 'connected transaction',
    'mandatory offer', 'disclosure', 'prospectus', 'SFC', 'HKEX', 'offering',
    'waiver', 'circular', 'public float', 'placing', 'subscription', 'underwriting',
    'timetable', 'schedule', 'timeline'
  ];
  
  const lowerQuery = query.toLowerCase();
  
  // First check for direct matches
  const foundTerms = financialTerms.filter(term => 
    lowerQuery.includes(term.toLowerCase())
  );
  
  // If no direct matches found but contains date references, add rights issue timetable
  if ((foundTerms.length === 0 || !foundTerms.some(term => term.includes('timetable'))) && 
    (lowerQuery.includes('date') || 
     lowerQuery.includes('june') ||
     lowerQuery.includes('jan') ||
     lowerQuery.includes('feb') ||
     lowerQuery.includes('mar') ||
     lowerQuery.includes('apr') ||
     lowerQuery.includes('may') ||
     lowerQuery.includes('jun') ||
     lowerQuery.includes('jul') ||
     lowerQuery.includes('aug') ||
     lowerQuery.includes('sep') ||
     lowerQuery.includes('oct') ||
     lowerQuery.includes('nov') ||
     lowerQuery.includes('dec') ||
     lowerQuery.match(/\d+\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i) ||
     lowerQuery.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/))) {
    
    // Add timetable terms if they're missing but query has dates
    if (lowerQuery.includes('rights') || lowerQuery.includes('right')) {
      return [...foundTerms, 'timetable', 'rights issue'].filter((v, i, a) => a.indexOf(v) === i);
    }
    return [...foundTerms, 'timetable'].filter((v, i, a) => a.indexOf(v) === i);
  }
  
  return foundTerms.length > 0 ? foundTerms : [query];
}

/**
 * Remove duplicate search results
 */
function removeDuplicateResults(results: any[]): any[] {
  const uniqueIds = new Set();
  return results.filter(result => {
    // Create a simple ID from title and source
    const resultId = `${result.title}|${result.source}`;
    if (uniqueIds.has(resultId)) {
      return false;
    }
    uniqueIds.add(resultId);
    return true;
  });
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
  
  // Special handling for timetable searches
  if (financialTerms.some(term => term.includes('timetable') || term.includes('schedule'))) {
    if (result.title.toLowerCase().includes('timetable')) score += 5;
    if (result.content.toLowerCase().includes('timetable')) score += 2;
  }
  
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
  
  // If we have results but they might be limited
  if (results.length < 2 && (query.toLowerCase().includes('rights issue') && query.toLowerCase().includes('timetable'))) {
    return 'Limited specific regulatory information found. Providing general rights issue timetable guidance based on Hong Kong Listing Rules Chapter 10.';
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

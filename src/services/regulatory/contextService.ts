
import { databaseService } from '../databaseService';
import { QUERY_TYPE_TO_CATEGORY } from '../constants/financialConstants';

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
      
      // Check if this query is about whitewash waivers specifically
      const isWhitewashWaiverQuery = normalizedQuery.includes('whitewash') || 
                                 normalizedQuery.includes('whitewashed') ||
                                 (normalizedQuery.includes('waiver') && normalizedQuery.includes('general offer'));
                                 
      if (isWhitewashWaiverQuery) {
        console.log('Identified as whitewash waiver query - specifically searching for related documents');
      }
      
      // Determine if this is a general offer query (takeovers code)
      const isGeneralOfferQuery = normalizedQuery.includes('general offer') || 
                               normalizedQuery.includes('takeover') ||
                               normalizedQuery.includes('mandatory offer') ||
                               isWhitewashWaiverQuery;
      
      // For general offer queries, specifically search for takeovers code documents
      let takeoversResults = [];
      if (isGeneralOfferQuery) {
        console.log('Identified as general offer query - specifically searching for Takeovers Code documents');
        
        // First, specifically check for the takeovers and mergers code PDF
        const takeoversCodeResults = await databaseService.searchByTitle("codes on takeovers and mergers and share buy backs");
        if (takeoversCodeResults.length > 0) {
          console.log('Found specific "codes on takeovers and mergers and share buy backs.pdf" document');
          takeoversResults = [...takeoversCodeResults];
        }
        
        // Direct search in takeovers category
        const categoryResults = await databaseService.search(normalizedQuery, 'takeovers');
        console.log(`Found ${categoryResults.length} Takeovers Code documents by category search`);
        takeoversResults = [...takeoversResults, ...categoryResults];
        
        // If direct search didn't yield results, try content search with specific terms
        if (takeoversResults.length === 0) {
          takeoversResults = await databaseService.search("general offer mandatory takeovers code", "takeovers");
          console.log(`Found ${takeoversResults.length} results from takeovers keyword search`);
        }
        
        // Special handling for whitewash waiver queries
        if (isWhitewashWaiverQuery) {
          const whitewashResults = await databaseService.search("whitewash waiver dealing requirements", "takeovers");
          console.log(`Found ${whitewashResults.length} whitewash waiver specific results`);
          
          // Add whitewash-specific documents to results
          takeoversResults = [...takeoversResults, ...whitewashResults];
        }
      }
      
      // Check for Trading Arrangement documents for corporate actions
      const isTradingArrangementQuery = normalizedQuery.includes('trading arrangement') || 
                                    normalizedQuery.includes('timetable') || 
                                    normalizedQuery.includes('schedule');
                                    
      const corporateActions = ['rights issue', 'open offer', 'share consolidation', 'board lot', 'company name change'];
      const isCorporateAction = corporateActions.some(action => normalizedQuery.includes(action));
      
      // For trading arrangement queries related to corporate actions, explicitly search for Trading Arrangement documents
      let tradingArrangementsResults = [];
      if (isTradingArrangementQuery) {
        if (isCorporateAction) {
          console.log('Identified as corporate action trading arrangement query');
          
          // Direct search for Trading Arrangement document by title
          tradingArrangementsResults = await databaseService.searchByTitle("Trading Arrangements");
          console.log(`Found ${tradingArrangementsResults.length} Trading Arrangement documents by title search`);
          
          // If title search didn't yield results, try content search
          if (tradingArrangementsResults.length === 0) {
            tradingArrangementsResults = await databaseService.search("trading arrangement corporate action", "listing_rules");
            console.log(`Found ${tradingArrangementsResults.length} results from trading arrangement keyword search`);
          }
        } else if (isGeneralOfferQuery) {
          console.log('Identified as general offer timetable query');
          // No specific search needed here as we already searched for takeovers documents
        }
      }
      
      // Determine the appropriate category based on query content
      let searchCategory = 'listing_rules'; // Default
      if (isGeneralOfferQuery) {
        searchCategory = 'takeovers';
      }
      
      // Regular search in appropriate category
      let searchResults = await databaseService.search(normalizedQuery, searchCategory);
      console.log(`Found ${searchResults.length} primary results from exact search in ${searchCategory}`);
      
      // Prioritize results based on query type
      if (isGeneralOfferQuery) {
        // For general offer queries, prioritize takeovers results
        searchResults = [...takeoversResults, ...searchResults];
      } else {
        // For other queries, prioritize trading arrangement results if applicable
        searchResults = [...tradingArrangementsResults, ...searchResults];
      }
      
      // If no results, try searching with extracted financial terms
      if (searchResults.length === 0 || searchResults.length < 2) {
        const financialTermsQuery = financialTerms.join(' ');
        const termResults = await databaseService.search(financialTermsQuery, searchCategory);
        console.log(`Found ${termResults.length} results using financial terms in ${searchCategory}`);
        
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
            
          if (isGeneralOfferQuery) {
            // Special handling for general offer timetable requests
            const timetableResults = await databaseService.search('general offer timetable takeovers', 'takeovers');
            console.log(`Found ${timetableResults.length} results using 'general offer timetable' keyword`);
            searchResults = [...searchResults, ...timetableResults];
          } else {
            // Default to rights issue timetable info for other timetable requests
            const timetableResults = await databaseService.search('rights issue timetable', 'listing_rules');
            console.log(`Found ${timetableResults.length} results using 'rights issue timetable' keyword`);
            searchResults = [...searchResults, ...timetableResults];
          }
        } else {
          // General financial term search across all categories
          const generalResults = await databaseService.search(financialTerms[0] || normalizedQuery);
          console.log(`Found ${generalResults.length} results from broad search`);
          searchResults = [...searchResults, ...generalResults];
        }
      }
      
      // For whitewash waiver queries, ensure we have dealing requirements information
      if (isWhitewashWaiverQuery && !searchResults.some(result => 
          result.content.toLowerCase().includes('dealing') && 
          result.content.toLowerCase().includes('whitewash'))) {
        console.log("Adding specific whitewash waiver dealing requirements");
        searchResults.push({
          title: "Whitewash Waiver Dealing Requirements",
          source: "Takeovers Code Note 1 to Rule 32",
          content: "When a waiver from a mandatory general offer obligation under Rule 26 is granted (whitewash waiver), neither the potential controlling shareholders nor any person acting in concert with them may deal in the securities of the company during the period between the announcement of the proposals and the completion of the subscription. The Executive will not normally waive an obligation under Rule 26 if the potential controlling shareholders or their concert parties have acquired voting rights in the company in the 6 months prior to the announcement of the proposals but subsequent to negotiations with the directors of the company.",
          category: "takeovers"
        });
      }
      
      // Ensure we have unique results
      const uniqueResults = removeDuplicateResults(searchResults);
      
      // Combine and prioritize results with financial relevance scoring
      const prioritizedResults = prioritizeByRelevance(uniqueResults, financialTerms);
      
      // Special case for general offer timetable - add fallback if needed
      if (isGeneralOfferQuery && 
          (query.toLowerCase().includes('timetable') || 
           query.toLowerCase().includes('schedule') ||
           query.toLowerCase().includes('timeline')) &&
          prioritizedResults.length < 2) {
        console.log("Enhancing general offer timetable context with fallback information");
        prioritizedResults.push({
          title: "General Offer Timetable",
          source: "Takeovers Code Rule 15",
          content: "A general offer timetable under the Takeovers Code begins with the Rule 3.5 announcement and must specify a closing date not less than 21 days from the date the offer document is posted. All conditions must be satisfied within 60 days from the offer document posting, unless extended by the Executive.",
          category: "takeovers"
        });
      }
      // Special case for rights issue timetables if needed
      else if (query.toLowerCase().includes('rights issue') && 
          (query.toLowerCase().includes('timetable') || 
           query.toLowerCase().includes('schedule') ||
           query.toLowerCase().includes('timeline')) &&
          prioritizedResults.length < 2) {
        console.log("Enhancing rights issue timetable context with fallback information");
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
    'timetable', 'schedule', 'timeline', 'whitewash', 'share buy back', 'dealing requirements'
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
  
  // Special case for whitewash waivers
  if (query.toLowerCase().includes('whitewash')) {
    if (results.some(result => result.content.toLowerCase().includes('dealing') && result.content.toLowerCase().includes('whitewash'))) {
      return 'Found relevant Takeovers Code provisions including specific dealing requirements for whitewash waivers under Note 1 to Rule 32.';
    }
  }
  
  const categoryCount: Record<string, number> = {};
  results.forEach(result => {
    categoryCount[result.category] = (categoryCount[result.category] || 0) + 1;
  });
  
  const mainCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat);
  
  // Check if we have the takeovers code document
  const hasTakeoversCode = results.some(result => 
    result.title.toLowerCase().includes('codes on takeovers and mergers') || 
    result.title.toLowerCase().includes('takeovers code')
  );
  
  let matchedTerms = financialTerms.length ? 
    `financial terms (${financialTerms.join(', ')})` : 
    'general financial context';
    
  if (hasTakeoversCode) {
    matchedTerms = 'Codes on Takeovers and Mergers and Share Buy-backs and ' + matchedTerms;
  }
  
  return `Found ${results.length} relevant Hong Kong financial document(s) matching ${matchedTerms}. Primary sources include ${mainCategories.join(', ')} regulations.`;
}

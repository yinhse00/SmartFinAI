import { databaseService, searchService, RegulatoryEntry } from '../databaseService';
import { QUERY_TYPE_TO_CATEGORY } from '../constants/financialConstants';
import { extractFinancialTerms } from './utils/financialTermsExtractor';
import { removeDuplicateResults, prioritizeByRelevance } from './utils/resultProcessors';
import { generateContextReasoning } from './utils/contextReasoningGenerator';
import { isWhitewashWaiverQuery, isGeneralOfferQuery, isTradingArrangementQuery, isCorporateActionQuery } from './utils/queryDetector';
import { getWhitewashWaiverFallbackEntry } from './fallbacks/whitewashFallback';

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
      const isWhitewashQuery = isWhitewashWaiverQuery(normalizedQuery);
                                 
      if (isWhitewashQuery) {
        console.log('Identified as whitewash waiver query - specifically searching for related documents');
      }
      
      // Determine if this is a general offer query (takeovers code)
      const isGeneralOffer = isGeneralOfferQuery(normalizedQuery, isWhitewashQuery);
      
      // For general offer queries, specifically search for takeovers code documents
      let takeoversResults = [];
      if (isGeneralOffer) {
        console.log('Identified as general offer query - specifically searching for Takeovers Code documents');
        
        // First, specifically check for the takeovers and mergers code PDF
        const takeoversCodeResults = await searchService.searchByTitle("codes on takeovers and mergers and share buy backs");
        if (takeoversCodeResults.length > 0) {
          console.log('Found specific "codes on takeovers and mergers and share buy backs.pdf" document');
          takeoversResults = [...takeoversCodeResults];
        }
        
        // Direct search in takeovers category
        const categoryResults = await searchService.search(normalizedQuery, 'takeovers');
        console.log(`Found ${categoryResults.length} Takeovers Code documents by category search`);
        takeoversResults = [...takeoversResults, ...categoryResults];
        
        // If direct search didn't yield results, try content search with specific terms
        if (takeoversResults.length === 0) {
          takeoversResults = await searchService.search("general offer mandatory takeovers code", "takeovers");
          console.log(`Found ${takeoversResults.length} results from takeovers keyword search`);
        }
        
        // Special handling for whitewash waiver queries
        if (isWhitewashQuery) {
          const whitewashResults = await searchService.search("whitewash waiver dealing requirements", "takeovers");
          console.log(`Found ${whitewashResults.length} whitewash waiver specific results`);
          
          // Add whitewash-specific documents to results
          takeoversResults = [...takeoversResults, ...whitewashResults];
        }
      }
      
      // Check for Trading Arrangement documents for corporate actions
      const isTradingArrangement = isTradingArrangementQuery(normalizedQuery);
      const isCorporateAction = isCorporateActionQuery(normalizedQuery);
      
      // For trading arrangement queries related to corporate actions, explicitly search for Trading Arrangement documents
      let tradingArrangementsResults = [];
      if (isTradingArrangement) {
        if (isCorporateAction) {
          console.log('Identified as corporate action trading arrangement query');
          
          // Direct search for Trading Arrangement document by title
          tradingArrangementsResults = await searchService.searchByTitle("Trading Arrangements");
          console.log(`Found ${tradingArrangementsResults.length} Trading Arrangement documents by title search`);
          
          // If title search didn't yield results, try content search
          if (tradingArrangementsResults.length === 0) {
            tradingArrangementsResults = await searchService.search("trading arrangement corporate action", "listing_rules");
            console.log(`Found ${tradingArrangementsResults.length} results from trading arrangement keyword search`);
          }
        } else if (isGeneralOffer) {
          console.log('Identified as general offer timetable query');
          // No specific search needed here as we already searched for takeovers documents
        }
      }
      
      // Determine the appropriate category based on query content
      let searchCategory = 'listing_rules'; // Default
      if (isGeneralOffer) {
        searchCategory = 'takeovers';
      }
      
      // Regular search in appropriate category
      let searchResults = await searchService.search(normalizedQuery, searchCategory);
      console.log(`Found ${searchResults.length} primary results from exact search in ${searchCategory}`);
      
      // Prioritize results based on query type
      if (isGeneralOffer) {
        // For general offer queries, prioritize takeovers results
        searchResults = [...takeoversResults, ...searchResults];
      } else {
        // For other queries, prioritize trading arrangement results if applicable
        searchResults = [...tradingArrangementsResults, ...searchResults];
      }
      
      // If no results, try searching with extracted financial terms
      if (searchResults.length === 0 || searchResults.length < 2) {
        const financialTermsQuery = financialTerms.join(' ');
        const termResults = await searchService.search(financialTermsQuery, searchCategory);
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
            
          if (isGeneralOffer) {
            // Special handling for general offer timetable requests
            const timetableResults = await searchService.search('general offer timetable takeovers', 'takeovers');
            console.log(`Found ${timetableResults.length} results using 'general offer timetable' keyword`);
            searchResults = [...searchResults, ...timetableResults];
          } else {
            // Default to rights issue timetable info for other timetable requests
            const timetableResults = await searchService.search('rights issue timetable', 'listing_rules');
            console.log(`Found ${timetableResults.length} results using 'rights issue timetable' keyword`);
            searchResults = [...searchResults, ...timetableResults];
          }
        } else {
          // General financial term search across all categories
          const generalResults = await searchService.search(financialTerms[0] || normalizedQuery);
          console.log(`Found ${generalResults.length} results from broad search`);
          searchResults = [...searchResults, ...generalResults];
        }
      }
      
      // For whitewash waiver queries, ensure we have dealing requirements information
      if (isWhitewashQuery && !searchResults.some(result => 
          result.content.toLowerCase().includes('dealing') && 
          result.content.toLowerCase().includes('whitewash'))) {
        console.log("Adding specific whitewash waiver dealing requirements");
        searchResults.push(getWhitewashWaiverFallbackEntry());
      }
      
      // Ensure we have unique results
      const uniqueResults = removeDuplicateResults(searchResults);
      
      // Combine and prioritize results with financial relevance scoring
      const prioritizedResults = prioritizeByRelevance(uniqueResults, financialTerms);
      
      // Special case for general offer timetable - add fallback if needed
      if (isGeneralOffer && 
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
      let searchResults = await searchService.search(normalizedQuery, 'listing_rules');
      
      // If no results, try keyword search
      if (searchResults.length === 0) {
        const financialTerms = extractFinancialTerms(query);
        if (query.toLowerCase().includes('timetable') || query.toLowerCase().includes('schedule')) {
          searchResults = await searchService.search('rights issue timetable');
        } else {
          searchResults = await searchService.search(financialTerms.join(' '));
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

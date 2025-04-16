import { searchService } from '../databaseService';
import { extractFinancialTerms } from './utils/financialTermsExtractor';
import { removeDuplicateResults, prioritizeByRelevance } from './utils/resultProcessors';
import { isWhitewashWaiverQuery, isGeneralOfferQuery, isTradingArrangementQuery, isCorporateActionQuery } from './utils/queryDetector';
import { searchStrategies } from './context/searchStrategies';
import { contextFormatter } from './context/contextFormatter';

/**
 * Financial regulatory context service - specialized for Hong Kong corporate finance
 */
export const contextService = {
  /**
   * Comprehensive database search that ensures all relevant sources are consulted
   * This is the primary method for ensuring thorough database verification before answering
   */
  getComprehensiveRegulatoryContext: async (query: string) => {
    try {
      console.group('Performing Comprehensive Database Review');
      console.log('Original Query:', query);
      
      // Start with standard regulatory context retrieval
      const initialContext = await contextService.getRegulatoryContextWithReasoning(query);
      
      // Log the initial results
      console.log('Initial context search complete');
      console.log('Context found:', initialContext.context ? 'Yes' : 'No');
      console.log('Reasoning:', initialContext.reasoning);
      
      // Check if we need to search more broadly
      if (!initialContext.context || initialContext.context.length < 100) {
        console.log('Initial search yielded limited results, expanding search scope');
        
        // Extract core concepts for broader search
        const terms = extractFinancialTerms(query);
        const broadQuery = terms.length > 0 ? terms.join(' ') : query;
        
        // Search across all categories
        console.log('Searching across all database categories');
        const { databaseEntries, referenceDocuments } = await searchService.searchComprehensive(broadQuery);
        
        if (databaseEntries.length > 0 || referenceDocuments.length > 0) {
          console.log(`Found ${databaseEntries.length} database entries and ${referenceDocuments.length} reference documents in expanded search`);
          
          // Format the additional results
          const additionalContext = contextFormatter.formatEntriesToContext(databaseEntries);
          const additionalReasoning = `Expanded database search found ${databaseEntries.length} entries and ${referenceDocuments.length} reference documents that may be relevant.`;
          
          // Combine with initial context if it exists
          if (initialContext.context) {
            return {
              context: initialContext.context + "\n\n--- ADDITIONAL CONTEXT ---\n\n" + additionalContext,
              reasoning: initialContext.reasoning + " " + additionalReasoning
            };
          } else {
            return {
              context: additionalContext,
              reasoning: additionalReasoning
            };
          }
        }
      }
      
      console.groupEnd();
      return initialContext;
    } catch (error) {
      console.error('Error in comprehensive regulatory context search:', error);
      return {
        context: 'Error performing comprehensive database search',
        reasoning: 'System was unable to thoroughly search the database due to an unexpected error.'
      };
    }
  },

  /**
   * Enhanced regulatory context retrieval with specialized financial semantic search
   */
  getRegulatoryContextWithReasoning: async (query: string) => {
    try {
      console.group('Retrieving Specialized Financial Context');
      console.log('Original Query:', query);
      
      // Check if this might be FAQ related
      const isFaqQuery = query.toLowerCase().includes('faq') || 
                         query.toLowerCase().includes('continuing obligation') ||
                         query.match(/\b10\.4\b/);
                         
      if (isFaqQuery) {
        console.log('Detected FAQ/continuing obligations query, prioritizing relevant documents');
        // Get FAQ documents first
        const faqResults = await searchStrategies.findFAQDocuments(query);
        
        if (faqResults.length > 0) {
          console.log(`Found ${faqResults.length} FAQ documents to prioritize`);
          // Format context with section headings and regulatory citations
          const context = contextFormatter.formatEntriesToContext(faqResults);
          
          // Generate reasoning that explains why these specific regulations are relevant
          const reasoning = `This response is based directly on official HKEX documentation from "10.4 FAQ Continuing Obligations" that provides authoritative guidance on the inquiry. The information is taken verbatim from the official FAQ document to ensure accuracy.`;
          
          console.groupEnd();
          return contextFormatter.createContextResponse(context, reasoning);
        }
      }
      
      // Check if this is a rights issue aggregation query
      const isAggregationQuery = query.toLowerCase().includes('rights issue') && 
        (query.toLowerCase().includes('aggregate') || 
         query.toLowerCase().includes('within 12 months') ||
         query.toLowerCase().includes('previous'));
      
      if (isAggregationQuery) {
        console.log('Detected rights issue aggregation query, prioritizing Rule 7.19A information');
      }
      
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
      
      // Check for specific rule references first - this takes priority
      const specificRuleResults = await searchStrategies.findSpecificRulesDocuments(normalizedQuery);
      
      if (specificRuleResults.length > 0) {
        console.log(`Found ${specificRuleResults.length} results specifically matching rule references`);
      }
      
      // For Rule 7.19A aggregation queries, ensure we have that specific rule information
      let aggregationResults = [];
      if (isAggregationQuery) {
        aggregationResults = await searchService.search('rule 7.19A aggregation requirements', 'listing_rules');
        console.log(`Found ${aggregationResults.length} results for Rule 7.19A aggregation`);
        
        // If no specific results found, add fallback
        if (aggregationResults.length === 0) {
          aggregationResults = [{
            title: "Rights Issue Aggregation Requirements",
            source: "Listing Rules Rule 7.19A",
            content: "Under Listing Rule 7.19A(1), if a rights issue, when aggregated with any other rights issues, open offers, and specific mandate placings announced by the issuer within the previous 12 months, would increase the number of issued shares by more than 50%, the rights issue must be made conditional on approval by shareholders at general meeting by resolution on which any controlling shareholders shall abstain from voting in favor. Where there is no controlling shareholder, directors and chief executive must abstain from voting in favor. The 50% threshold applies to the aggregate increase over the 12-month period, not to each individual corporate action.",
            category: "listing_rules"
          }];
        }
      }
      
      // Determine if this is a general offer query (takeovers code)
      const isGeneralOffer = isGeneralOfferQuery(normalizedQuery, isWhitewashQuery);
      
      // For general offer queries, specifically search for takeovers code documents
      let takeoversResults = [];
      if (isGeneralOffer) {
        takeoversResults = await searchStrategies.findGeneralOfferDocuments(normalizedQuery, isWhitewashQuery);
      }
      
      // Check for Trading Arrangement documents for corporate actions
      const isTradingArrangement = isTradingArrangementQuery(normalizedQuery);
      const isCorporateAction = isCorporateActionQuery(normalizedQuery);
      
      // For trading arrangement queries related to corporate actions, explicitly search for Trading Arrangement documents
      let tradingArrangementsResults = [];
      if (isTradingArrangement) {
        tradingArrangementsResults = await searchStrategies.findTradingArrangementDocuments(normalizedQuery, isCorporateAction);
      }
      
      // Determine the appropriate category based on query content
      let searchCategory = 'listing_rules'; // Default
      if (isGeneralOffer) {
        searchCategory = 'takeovers';
      }
      
      // Regular search in appropriate category
      let searchResults = await searchService.search(normalizedQuery, searchCategory);
      console.log(`Found ${searchResults.length} primary results from exact search in ${searchCategory}`);
      
      // Start with aggregation results for rights issue aggregation queries
      if (isAggregationQuery) {
        searchResults = [...aggregationResults, ...searchResults];
      }
      
      // Add specific rule results (high priority)
      searchResults = [...specificRuleResults, ...searchResults];
      
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
            
          const timetableResults = await searchStrategies.findTimetableDocuments(query, isGeneralOffer);
          searchResults = [...searchResults, ...timetableResults];
        } else {
          // General financial term search across all categories
          const generalResults = await searchService.search(financialTerms[0] || normalizedQuery);
          console.log(`Found ${generalResults.length} results from broad search`);
          searchResults = [...searchResults, ...generalResults];
        }
      }
      
      // Add any necessary fallback documents
      searchResults = searchStrategies.addFallbackDocumentsIfNeeded(
        searchResults, 
        query, 
        isWhitewashQuery, 
        isGeneralOffer
      );
      
      // Ensure we have unique results
      const uniqueResults = removeDuplicateResults(searchResults);
      
      // Combine and prioritize results with financial relevance scoring
      const prioritizedResults = prioritizeByRelevance(uniqueResults, financialTerms);
      
      // Format context with section headings and regulatory citations
      const context = contextFormatter.formatEntriesToContext(prioritizedResults);
      
      // Generate reasoning that explains why these specific regulations are relevant
      const reasoning = contextFormatter.generateReasoning(prioritizedResults, query, financialTerms);
      
      console.log('Context Length:', context.length);
      console.log('Reasoning:', reasoning);
      console.groupEnd();
      
      return contextFormatter.createContextResponse(context, reasoning);
    } catch (error) {
      console.error('Error retrieving specialized financial context:', error);
      return {
        context: 'Error fetching financial regulatory context',
        reasoning: 'Unable to search specialized financial database due to an unexpected error.'
      };
    }
  },

  /**
   * Get regulatory context for a given financial query (simplified version)
   */
  getRegulatoryContext: async (query: string): Promise<string> => {
    try {
      console.log('Basic Financial Context Search:', query);
      
      // Check if this might be FAQ related
      const isFaqQuery = query.toLowerCase().includes('faq') || 
                        query.toLowerCase().includes('continuing obligation') ||
                        query.match(/\b10\.4\b/);
      
      if (isFaqQuery) {
        // Get FAQ documents first
        const faqResults = await searchStrategies.findFAQDocuments(query);
        
        if (faqResults.length > 0) {
          console.log(`Found ${faqResults.length} FAQ documents to prioritize`);
          return contextFormatter.formatEntriesToContext(faqResults);
        }
      }
      
      // Normalize query to handle common variations
      const normalizedQuery = query.toLowerCase()
        .replace('right issue', 'rights issue')
        .replace('rights issues', 'rights issue');
      
      // Check for specific rule references first
      const specificRuleResults = await searchStrategies.findSpecificRulesDocuments(normalizedQuery);
      
      if (specificRuleResults.length > 0) {
        console.log(`Found ${specificRuleResults.length} results specifically matching rule references`);
        const ruleContext = contextFormatter.formatEntriesToContext(specificRuleResults);
        return ruleContext;
      }
      
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
      const context = contextFormatter.formatEntriesToContext(searchResults);
      
      return context || 'No specific Hong Kong financial regulatory information found.';
    } catch (error) {
      console.error('Error retrieving financial regulatory context:', error);
      return 'Error fetching Hong Kong financial regulatory context';
    }
  }
};

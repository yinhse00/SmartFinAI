
import { RegulatoryEntry } from '../../database/types';
import { searchService } from '../../databaseService';
import { extractFinancialTerms } from '../utils/financialTermsExtractor';
import { removeDuplicateResults, prioritizeByRelevance } from '../utils/resultProcessors';
import { isWhitewashWaiverQuery, isGeneralOfferQuery, isTradingArrangementQuery, isCorporateActionQuery } from '../utils/queryDetector';
import { faqSearchService, findFAQDocuments } from './faqSearchService';
import { specificRuleSearchService } from './specificRuleSearchService';
import { takeoversSearchService } from './takeoversSearchService';
import { tradingArrangementsService } from './tradingArrangementsService';
import { aggregationSearchService } from './aggregationSearchService';
import { fallbackService } from './fallbackService';
import { contextFormatter } from './contextFormatter';

/**
 * Orchestrates the search process across multiple specialized services
 */
export const contextSearchOrchestrator = {
  /**
   * Execute comprehensive search strategy across all specialized services
   */
  executeComprehensiveSearch: async (query: string) => {
    try {
      console.group('Orchestrating Comprehensive Financial Search');
      console.log('Original Query:', query);
      
      // Check if this might be FAQ related
      const isFaqQuery = query.toLowerCase().includes('faq') || 
                         query.toLowerCase().includes('continuing obligation') ||
                         Boolean(query.match(/\b10\.4\b/));
                         
      if (isFaqQuery) {
        console.log('Detected FAQ/continuing obligations query, prioritizing relevant documents');
        // Get FAQ documents first
        const faqResults = await findFAQDocuments(query);
        
        if (faqResults.length > 0) {
          const context = contextFormatter.formatEntriesToContext(faqResults);
          const reasoning = `This response is based directly on official HKEX documentation from "10.4 FAQ Continuing Obligations" that provides authoritative guidance on the inquiry.`;
          console.groupEnd();
          return contextFormatter.createContextResponse(context, reasoning);
        }
      }
      
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
      const specificRuleResults = await specificRuleSearchService.findSpecificRulesDocuments(normalizedQuery);
      if (specificRuleResults.length > 0) {
        console.log(`Found ${specificRuleResults.length} results specifically matching rule references`);
      }
      
      // For Rule 7.19A aggregation queries, ensure we have that specific rule information
      const aggregationResults = await aggregationSearchService.findAggregationDocuments(query);
      
      // Determine if this is a general offer query (takeovers code)
      const isGeneralOffer = isGeneralOfferQuery(normalizedQuery, isWhitewashQuery);
      
      // For general offer queries, specifically search for takeovers code documents
      let takeoversResults: RegulatoryEntry[] = [];
      if (isGeneralOffer) {
        takeoversResults = await takeoversSearchService.findGeneralOfferDocuments(normalizedQuery, isWhitewashQuery);
      }
      
      // Check for Trading Arrangement documents for corporate actions
      const isTradingArrangement = isTradingArrangementQuery(normalizedQuery);
      const isCorporateAction = isCorporateActionQuery(normalizedQuery);
      
      // For trading arrangement queries related to corporate actions, explicitly search for Trading Arrangement documents
      let tradingArrangementsResults: RegulatoryEntry[] = [];
      if (isTradingArrangement) {
        tradingArrangementsResults = await tradingArrangementsService.findTradingArrangementDocuments(normalizedQuery, isCorporateAction);
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
      if (aggregationResults.length > 0) {
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
      
      // Extract financial terms for search enhancement
      const financialTerms = extractFinancialTerms(query);
      
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
            
          const timetableResults = await tradingArrangementsService.findTimetableDocuments(query, isGeneralOffer);
          searchResults = [...searchResults, ...timetableResults];
        } else {
          // General financial term search across all categories
          const generalResults = await searchService.search(financialTerms[0] || normalizedQuery);
          console.log(`Found ${generalResults.length} results from broad search`);
          searchResults = [...searchResults, ...generalResults];
        }
      }
      
      // Add any necessary fallback documents
      searchResults = await fallbackService.addFallbackDocumentsIfNeeded(
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
      console.error('Error in comprehensive financial search:', error);
      console.groupEnd();
      return {
        context: 'Error fetching financial regulatory context',
        reasoning: 'Unable to search specialized financial database due to an unexpected error.'
      };
    }
  }
};

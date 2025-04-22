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
import { summaryIndexService } from '../../database/summaryIndexService';

/**
 * Orchestrates the search process across multiple specialized services
 * following the revised sequential search workflow
 */
export const contextSearchOrchestrator = {
  /**
   * Execute comprehensive search strategy following defined workflow sequence
   */
  executeComprehensiveSearch: async (query: string) => {
    try {
      console.group('Orchestrating Sequential Financial Search');
      console.log('Original Query:', query);
      
      let combinedContext = '';
      let combinedReasoning = '';
      let searchResults: RegulatoryEntry[] = [];
      
      // STEP 1: Send to Grok for initial analysis (this happens at the query processing level)
      console.log('STEP 1: Initial query analysis completed');
      
      // STEP 2 & 3: First check Summary and Keyword Index 
      console.log('STEP 2 & 3: Checking Summary and Keyword Index');
      
      // Removed specific reference to "Summary and Keyword Index_Listing Rule.docx"
      const listingRulesSummary = await summaryIndexService.findRelevantSummaryByFile(query, 'Listing Rules Summary.docx');
      
      if (listingRulesSummary.found) {
        console.log('Found matches in Listing Rules Summary Index');
        searchResults = [...searchResults, ...await searchService.getEntriesBySourceIds(listingRulesSummary.sourceIds || [])];
      }
      
      // STEP 4: Search relevant files based on Listing Rules summary matches
      console.log('STEP 4: Searching relevant Listing Rules files');
      const listingRulesResults = await searchService.search(query, 'listing_rules');
      searchResults = [...searchResults, ...listingRulesResults];
      
      // STEP 5: Check token count (handled at response generation level)
      console.log('STEP 5: Token count will be checked during response generation');
      
      // STEP 6: Check Takeovers Code
      console.log('STEP 6: Checking Takeovers Code files');
      const takeoversResults = await takeoversSearchService.findTakeoverDocuments(query);
      
      // Add takeovers results to our combined results
      searchResults = [...searchResults, ...takeoversResults];
      
      // STEP 7: Check token count (handled at response generation level)
      console.log('STEP 7: Token count will be checked during response generation');
      
      // STEP 8: Check Summary and Keyword Index_Rule and Guidance.docx
      console.log('STEP 8: Checking Summary and Keyword Index_Rule and Guidance.docx');
      const guidanceSummary = await summaryIndexService.findRelevantSummaryByFile(query, 'Summary and Keyword Index_Rule and Guidance.docx');
      
      if (guidanceSummary.found) {
        console.log('Found matches in Guidance Summary Index');
        searchResults = [...searchResults, ...await searchService.getEntriesBySourceIds(guidanceSummary.sourceIds || [])];
      }
      
      // STEP 9: Search relevant files based on Guidance summary matches
      console.log('STEP 9: Searching relevant Guidance files');
      const guidanceResults = await searchService.search(query, 'guidance');
      searchResults = [...searchResults, ...guidanceResults];
      
      // STEP 10: Check token count (handled at response generation level)
      console.log('STEP 10: Token count will be checked during response generation');
      
      // STEP 11: Prepare final results
      console.log('STEP 11: Preparing final analysis results');
      
      // Extract financial terms for relevance sorting
      const financialTerms = extractFinancialTerms(query);
      
      // Remove duplicates from all search results
      const uniqueResults = removeDuplicateResults(searchResults);
      
      // Prioritize results by relevance
      const prioritizedResults = prioritizeByRelevance(uniqueResults, financialTerms);
      
      // Format context with section headings and regulatory citations
      const context = contextFormatter.formatEntriesToContext(prioritizedResults);
      
      // Generate reasoning that explains our sequential search process
      const reasoning = `Analysis conducted following sequential approach: first checked Listing Rules, then Takeovers Code, and finally Interpretation and Guidance documents. Results combined and prioritized by relevance to query "${query}".`;
      
      console.log('Context Length:', context.length);
      console.log('Search Workflow Completed');
      console.groupEnd();
      
      return contextFormatter.createContextResponse(context, reasoning);
    } catch (error) {
      console.error('Error in sequential financial search:', error);
      console.groupEnd();
      return {
        context: 'Error fetching financial regulatory context',
        reasoning: 'Unable to complete the sequential search workflow due to an unexpected error.'
      };
    }
  }
};

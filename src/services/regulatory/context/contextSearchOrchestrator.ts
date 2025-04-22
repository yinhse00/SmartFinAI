
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

export const contextSearchOrchestrator = {
  executeComprehensiveSearch: async (query: string) => {
    try {
      console.group('Orchestrating Sequential Financial Search');
      console.log('Original Query:', query);
      
      let combinedContext = '';
      let combinedReasoning = '';
      let searchResults: RegulatoryEntry[] = [];
      
      // STEP 1: Initial query analysis 
      console.log('STEP 1: Initial query analysis completed');
      
      // STEP 2 & 3: Check multiple Summary and Keyword Indexes
      console.log('STEP 2 & 3: Checking Multiple Summary and Keyword Indexes');
      
      const summaryFiles = [
        'Listing Rules Summary.docx', 
        'Summary and Keyword Index_Rule and Guidance.docx',
        'Takeovers Code Summary.docx'
      ];
      
      // Search across multiple summary files
      for (const file of summaryFiles) {
        const summarySummary = await summaryIndexService.findRelevantSummaryByFile(query, file);
        
        if (summarySummary.found) {
          console.log(`Found matches in ${file}`);
          const fileResults = await searchService.getEntriesBySourceIds(summarySummary.sourceIds || []);
          searchResults = [...searchResults, ...fileResults];
        }
      }
      
      // STEP 4: Comprehensive search across different rule categories
      console.log('STEP 4: Comprehensive search across rule categories');
      const searchCategories = ['listing_rules', 'guidance', 'takeovers'];
      
      for (const category of searchCategories) {
        const categoryResults = await searchService.search(query, category);
        searchResults = [...searchResults, ...categoryResults];
      }
      
      // STEP 5: Specialized document searches
      console.log('STEP 5: Specialized document searches');
      const takeoversResults = await takeoversSearchService.findTakeoverDocuments(query);
      searchResults = [...searchResults, ...takeoversResults];
      
      // Extract financial terms for relevance sorting
      const financialTerms = extractFinancialTerms(query);
      
      // Remove duplicates from all search results
      const uniqueResults = removeDuplicateResults(searchResults);
      
      // Prioritize results by relevance
      const prioritizedResults = prioritizeByRelevance(uniqueResults, financialTerms);
      
      // Format context with section headings and regulatory citations
      const context = contextFormatter.formatEntriesToContext(prioritizedResults);
      
      // Generate reasoning that explains our sequential search process
      const reasoning = `Comprehensive analysis conducted across multiple regulatory documents: Listing Rules, Rule and Guidance, Takeovers Code. Multiple search strategies employed to ensure thorough coverage for query "${query}".`;
      
      console.log('Context Length:', context.length);
      console.log('Search Workflow Completed');
      console.groupEnd();
      
      return contextFormatter.createContextResponse(context, reasoning);
    } catch (error) {
      console.error('Error in sequential financial search:', error);
      console.groupEnd();
      return {
        context: 'Error fetching financial regulatory context',
        reasoning: 'Unable to complete the comprehensive search workflow due to an unexpected error.'
      };
    }
  }
};


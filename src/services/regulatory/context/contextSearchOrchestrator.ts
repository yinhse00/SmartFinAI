
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
      console.group('Orchestrating Comprehensive Financial Search');
      console.log('Original Query:', query);
      
      let searchResults: RegulatoryEntry[] = [];
      
      // STEP 1: Initial query analysis - check for key regulatory terms
      console.log('STEP 1: Initial query analysis');
      const isDefinitionQuery = query.toLowerCase().includes('what is') || 
                               query.toLowerCase().includes('definition of') ||
                               query.toLowerCase().includes('define');
                               
      const isConnectedPersonQuery = query.toLowerCase().includes('connected person') ||
                                    query.toLowerCase().includes('connected transaction');
      
      // STEP 2: Check multiple Summary and Keyword Indexes
      console.log('STEP 2: Checking Multiple Summary and Keyword Indexes');
      
      const summaryFiles = [
        'Listing Rules Summary.docx', 
        'Summary and Keyword Index_Rule and Guidance.docx',
        'Takeovers Code Summary.docx'
      ];
      
      // For definition queries, especially about connected persons,
      // we search ALL sources regardless of initial matches
      let foundInSummary = false;
      
      // Search across multiple summary files
      for (const file of summaryFiles) {
        console.log(`Searching summary file: ${file}`);
        const summarySummary = await summaryIndexService.findRelevantSummaryByFile(query, file);
        
        if (summarySummary.found) {
          console.log(`Found matches in ${file}`);
          const fileResults = await searchService.getEntriesBySourceIds(summarySummary.sourceIds || []);
          searchResults = [...searchResults, ...fileResults];
          foundInSummary = true;
        }
      }
      
      // STEP 3: ALWAYS search comprehensive database for important terms
      // For definition queries, especially about connected persons, we search ALL sources
      console.log('STEP 3: Comprehensive search across rule categories');
      
      // These terms always need comprehensive search across all sources
      const importantTerms = ['connected person', 'connected transaction', 'whitewash', 'waiver'];
      const needsComprehensiveSearch = importantTerms.some(term => query.toLowerCase().includes(term)) ||
                                      isDefinitionQuery;
      
      // If this is a definition query or contains important terms, search everything
      if (needsComprehensiveSearch) {
        console.log('Important regulatory term detected - performing comprehensive search across all sources');
        
        // Search across all categories regardless of summary index results
        const searchCategories = ['listing_rules', 'guidance', 'takeovers'];
        
        for (const category of searchCategories) {
          console.log(`Searching category: ${category}`);
          const categoryResults = await searchService.search(query, category);
          searchResults = [...searchResults, ...categoryResults];
        }
        
        // For connected person queries, prioritize the actual definition in Chapter 14A
        if (isConnectedPersonQuery) {
          console.log('Connected person query detected - searching for specific definition in Chapter 14A');
          const chapterResults = await searchService.search('Chapter 14A connected person definition', 'listing_rules');
          // Put Chapter 14A results first for connected person queries
          searchResults = [...chapterResults, ...searchResults];
        }
      } else if (!foundInSummary) {
        // If not found in summary and not an important term, search across different rule categories
        console.log('No summary matches found - performing category search');
        const searchCategories = ['listing_rules', 'guidance', 'takeovers'];
        
        for (const category of searchCategories) {
          const categoryResults = await searchService.search(query, category);
          searchResults = [...searchResults, ...categoryResults];
        }
      }
      
      // STEP 4: Specialized document searches
      console.log('STEP 4: Specialized document searches');
      const takeoversResults = await takeoversSearchService.findTakeoverDocuments(query);
      searchResults = [...searchResults, ...takeoversResults];
      
      // For FAQ queries, prioritize FAQ content
      if (query.toLowerCase().includes('faq') || query.toLowerCase().includes('frequently asked')) {
        console.log('FAQ query detected, searching for FAQ documents');
        const faqResults = await findFAQDocuments(query);
        searchResults = [...faqResults, ...searchResults];
      }
      
      // Extract financial terms for relevance sorting
      const financialTerms = extractFinancialTerms(query);
      
      // Remove duplicates from all search results
      const uniqueResults = removeDuplicateResults(searchResults);
      
      // Prioritize results by relevance
      const prioritizedResults = prioritizeByRelevance(uniqueResults, financialTerms);
      
      // Format context with section headings and regulatory citations
      const context = contextFormatter.formatEntriesToContext(prioritizedResults);
      
      // Generate reasoning that explains our search process
      const reasoning = `Comprehensive analysis conducted across multiple regulatory documents including Listing Rules Chapter 14A, Rule and Guidance, and Takeovers Code. Enhanced search strategy implemented for definition queries to ensure complete information for query "${query}".`;
      
      console.log('Context Length:', context.length);
      console.log('Search Sources Checked:', summaryFiles.join(', ') + ', listing_rules, guidance, takeovers');
      console.log('Search Workflow Completed');
      console.groupEnd();
      
      return contextFormatter.createContextResponse(context, reasoning);
    } catch (error) {
      console.error('Error in comprehensive financial search:', error);
      console.groupEnd();
      return {
        context: 'Error fetching financial regulatory context',
        reasoning: 'Unable to complete the comprehensive search workflow due to an unexpected error.'
      };
    }
  }
};

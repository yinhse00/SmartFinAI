
import { RegulatoryEntry } from '../../database/types';
import { searchService } from '../../databaseService';
import { extractFinancialTerms } from '../utils/financialTermsExtractor';
import { removeDuplicateResults, prioritizeByRelevance } from '../utils/resultProcessors';
import { summaryIndexService } from '../../database/summaryIndexService';
import { contextFormatter } from './contextFormatter';

export const contextSearchOrchestrator = {
  executeComprehensiveSearch: async (query: string) => {
    try {
      console.group('Orchestrating Enhanced Financial Search');
      console.log('Original Query:', query);
      
      let searchResults: RegulatoryEntry[] = [];
      
      // STEP 1: Initial query analysis for definition and important terms
      console.log('STEP 1: Initial query analysis');
      const isDefinitionQuery = query.toLowerCase().includes('what is') || 
                               query.toLowerCase().includes('definition of') ||
                               query.toLowerCase().includes('define');
                               
      const isConnectedPersonQuery = query.toLowerCase().includes('connected person') ||
                                    query.toLowerCase().includes('connected transaction');
      
      // For definition queries, especially about connected persons,
      // we search ALL sources regardless of initial matches
      const needsComprehensiveSearch = isDefinitionQuery || isConnectedPersonQuery;
      
      // STEP 2: Check multiple Summary and Keyword Indexes first
      console.log('STEP 2: Checking Multiple Summary and Keyword Indexes');
      
      const summaryFiles = [
        'Listing Rules Summary.docx',
        'Summary and Keyword Index_Rule and Guidance.docx',
        'Takeovers Code Summary.docx'
      ];
      
      // Search across multiple summary files
      for (const file of summaryFiles) {
        console.log(`Searching summary file: ${file}`);
        const summarySummary = await summaryIndexService.findRelevantSummaryByFile(query, file);
        
        if (summarySummary.found) {
          console.log(`Found matches in ${file}`);
          const fileResults = await searchService.getEntriesBySourceIds(summarySummary.sourceIds || []);
          searchResults = [...searchResults, ...fileResults];
        }
      }
      
      // STEP 3: For definition queries or important terms, ALWAYS do comprehensive search
      if (needsComprehensiveSearch) {
        console.log('Important regulatory term detected - performing comprehensive search');
        
        // Search across all categories
        const searchCategories = ['listing_rules', 'guidance', 'takeovers'];
        
        for (const category of searchCategories) {
          console.log(`Searching category: ${category}`);
          const categoryResults = await searchService.search(query, category);
          searchResults = [...searchResults, ...categoryResults];
        }
        
        // For connected person queries, prioritize Chapter 14A content
        if (isConnectedPersonQuery) {
          console.log('Connected person query - prioritizing Chapter 14A content');
          const chapterResults = await searchService.search('Chapter 14A connected person definition', 'listing_rules');
          searchResults = [...chapterResults, ...searchResults];
        }
      }
      
      // STEP 4: Remove duplicates and prioritize results
      const uniqueResults = removeDuplicateResults(searchResults);
      const financialTerms = extractFinancialTerms(query);
      const prioritizedResults = prioritizeByRelevance(uniqueResults, financialTerms);
      
      // Format context with section headings and regulatory citations
      const context = contextFormatter.formatEntriesToContext(prioritizedResults);
      
      // Generate detailed reasoning for the search process
      const reasoning = `Comprehensive analysis conducted across multiple regulatory sources. Enhanced search strategy implemented for definition query "${query}" with focus on Chapter 14A and related regulatory content.`;
      
      console.log('Search Workflow Completed');
      console.groupEnd();
      
      return contextFormatter.createContextResponse(context, reasoning);
    } catch (error) {
      console.error('Error in comprehensive financial search:', error);
      console.groupEnd();
      return {
        context: 'Error fetching financial regulatory context',
        reasoning: 'Search workflow encountered an unexpected error.'
      };
    }
  }
};


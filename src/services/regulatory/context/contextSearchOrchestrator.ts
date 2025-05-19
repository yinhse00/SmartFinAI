
import { RegulatoryEntry } from '../../database/types';
import { searchService } from '../../databaseService';
import { extractFinancialTerms } from '../utils/financialTermsExtractor';
import { removeDuplicateResults, prioritizeByRelevance } from '../utils/resultProcessors';
import { summaryIndexService } from '../../database/summaryIndexService';
import { contextFormatter } from './contextFormatter';

// Cache for search results
const searchResultsCache = new Map<string, {
  results: RegulatoryEntry[],
  timestamp: number,
  category?: string
}>();

// Cache expiration time (15 minutes)
const CACHE_EXPIRATION = 15 * 60 * 1000;

// Generate cache key for search
const generateSearchCacheKey = (query: string, category?: string) => {
  return `${query.toLowerCase().substring(0, 100)}${category ? `-${category}` : ''}`;
};

export const contextSearchOrchestrator = {
  executeComprehensiveSearch: async (query: string) => {
    try {
      console.group('Orchestrating Enhanced Financial Search');
      console.log('Original Query:', query);
      
      // Generate cache key for this query
      const cacheKey = generateSearchCacheKey(query);
      
      // Check cache first
      const cachedResults = searchResultsCache.get(cacheKey);
      if (cachedResults && (Date.now() - cachedResults.timestamp < CACHE_EXPIRATION)) {
        console.log('Using cached search results');
        // Use cached results but still format them
        const context = contextFormatter.formatEntriesToContext(cachedResults.results);
        console.groupEnd();
        
        return contextFormatter.createContextResponse(context, 
          `Cached results from previous search (${Math.round((Date.now() - cachedResults.timestamp) / 1000)}s ago)`);
      }
      
      let searchResults: RegulatoryEntry[] = [];
      
      // STEP 1: Initial query analysis for specialized topics
      console.log('STEP 1: Initial query analysis');
      const isDefinitionQuery = query.toLowerCase().includes('what is') || 
                               query.toLowerCase().includes('definition of') ||
                               query.toLowerCase().includes('define');
                               
      const isConnectedPersonQuery = query.toLowerCase().includes('connected person') ||
                                    query.toLowerCase().includes('connected transaction');
      
      const isChapter18CQuery = query.toLowerCase().includes('chapter 18c') ||
                              query.toLowerCase().includes('specialist technology') ||
                              query.toLowerCase().includes('18c requirements');
      
      // For definition queries, Chapter 18C, or connected persons,
      // we search ALL sources regardless of initial matches
      const needsComprehensiveSearch = isDefinitionQuery || isConnectedPersonQuery || isChapter18CQuery;
      
      // STEP 2: Check multiple Summary and Keyword Indexes first - run in parallel for speed
      console.log('STEP 2: Checking Multiple Summary and Keyword Indexes');
      
      const summaryFiles = [
        'Listing Rules Summary.docx',
        'Summary and Keyword Index_Rule and Guidance.docx',
        'Takeovers Code Summary.docx'
      ];
      
      // Search across multiple summary files in parallel
      const summaryPromises = summaryFiles.map(file => 
        summaryIndexService.findRelevantSummaryByFile(query, file)
      );
      
      const summaryResults = await Promise.all(summaryPromises);
      
      // Process summary results and collect source IDs
      const allSourceIds = summaryResults
        .filter(result => result.found)
        .flatMap(result => result.sourceIds || []);
      
      if (allSourceIds.length > 0) {
        console.log(`Found matches in summary files`);
        // Get all entries in a single batch
        const fileResults = await searchService.getEntriesBySourceIds(allSourceIds);
        searchResults = [...searchResults, ...fileResults];
      }
      
      // STEP 2.5: For Chapter 18C queries, explicitly search for Chapter 18C content
      if (isChapter18CQuery) {
        console.log('Chapter 18C query detected - searching Chapter 18C specific content');
        const chapter18CResults = await searchService.search('Chapter 18C Specialist Technology', 'listing_rules');
        searchResults = [...chapter18CResults, ...searchResults];
        
        // Also search for related guidance letters
        const guidanceResults = await searchService.search('Specialist Technology guidance letters', 'guidance');
        searchResults = [...searchResults, ...guidanceResults];
      }
      
      // STEP 3: For important topics, ALWAYS do comprehensive search
      if (needsComprehensiveSearch) {
        console.log('Important regulatory term detected - performing comprehensive search');
        
        // Search across all categories in parallel
        const searchCategories = ['listing_rules', 'guidance', 'takeovers'];
        
        const categoryPromises = searchCategories.map(category => 
          searchService.search(query, category)
        );
        
        const categoryResults = await Promise.all(categoryPromises);
        
        // Combine all category results
        categoryResults.forEach(results => {
          searchResults = [...searchResults, ...results];
        });
        
        // For connected person queries, prioritize Chapter 14A content
        if (isConnectedPersonQuery) {
          console.log('Connected person query - prioritizing Chapter 14A content');
          const chapterResults = await searchService.search('Chapter 14A connected person definition', 'listing_rules');
          searchResults = [...chapterResults, ...searchResults];
        }
        
        // For Chapter 18C queries, ensure we have the full chapter content
        if (isChapter18CQuery) {
          console.log('Chapter 18C query - ensuring full chapter content');
          const chapter18CFullResults = await searchService.search('Chapter 18C complete', 'listing_rules');
          searchResults = [...chapter18CFullResults, ...searchResults]; 
        }
      }
      
      // STEP 4: Remove duplicates and prioritize results
      const uniqueResults = removeDuplicateResults(searchResults);
      let financialTerms = extractFinancialTerms(query);
      
      // For Chapter 18C queries, ensure specialist technology terms are included
      if (isChapter18CQuery) {
        financialTerms = [
          ...financialTerms,
          'chapter 18c',
          'specialist technology',
          'commercial company',
          'pre-commercial company',
          'sophisticated investor'
        ];
      }
      
      const prioritizedResults = prioritizeByRelevance(uniqueResults, financialTerms);
      
      // Cache search results for future use
      searchResultsCache.set(cacheKey, {
        results: prioritizedResults,
        timestamp: Date.now(),
        category: isChapter18CQuery ? 'chapter18c' : 
                 isConnectedPersonQuery ? 'connected' : 
                 isDefinitionQuery ? 'definition' : 'general'
      });
      
      // Limit cache size
      if (searchResultsCache.size > 30) {
        const oldestKey = Array.from(searchResultsCache.keys())[0];
        searchResultsCache.delete(oldestKey);
      }
      
      // Format context with section headings and regulatory citations
      const context = contextFormatter.formatEntriesToContext(prioritizedResults);
      
      // Generate detailed reasoning for the search process
      let reasoning = `Comprehensive analysis conducted across multiple regulatory sources.`;
      
      if (isChapter18CQuery) {
        reasoning += ` Enhanced search strategy implemented for Chapter 18C Specialist Technology Companies query "${query}" with focus on Chapter 18C requirements and related guidance.`;
      } else if (isDefinitionQuery) {
        reasoning += ` Enhanced search strategy implemented for definition query "${query}" with focus on regulatory definitions.`;
      }
      
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
  },
  
  // Clear the search results cache - useful for testing and debugging
  clearSearchCache: () => {
    searchResultsCache.clear();
    console.log('Search results cache cleared');
  }
};

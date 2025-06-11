
import { searchService } from '@/services/database/searchService';
import { liveSearchService, LiveSearchResult } from '@/services/api/xai/liveSearchService';
import { RegulatoryEntry } from '@/services/database/types';

export interface HybridSearchResult {
  localResults: RegulatoryEntry[];
  liveResults: LiveSearchResult[];
  searchStrategy: 'local_only' | 'live_only' | 'hybrid';
  query: string;
}

/**
 * Hybrid search service that combines local database and live web search
 */
export const hybridSearchService = {
  /**
   * Determine if a query needs live search
   */
  needsLiveSearch: (query: string): boolean => {
    const liveSearchTriggers = [
      'recent', 'latest', 'current', 'today', 'yesterday',
      'market condition', 'trading status', 'suspension',
      'announcement', 'circular', 'price', 'volume',
      'news', 'update', 'amendment', 'new rule'
    ];

    const queryLower = query.toLowerCase();
    return liveSearchTriggers.some(trigger => queryLower.includes(trigger));
  },

  /**
   * Determine search strategy based on query characteristics
   */
  determineSearchStrategy: (query: string): 'local_only' | 'live_only' | 'hybrid' => {
    if (hybridSearchService.needsLiveSearch(query)) {
      // Check if it's also asking for regulatory rules/procedures
      const hasRegulatoryTerms = query.toLowerCase().match(
        /rule|regulation|requirement|listing|takeover|procedure|process/
      );
      return hasRegulatoryTerms ? 'hybrid' : 'live_only';
    }
    return 'local_only';
  },

  /**
   * Perform hybrid search combining local and live results
   */
  search: async (query: string, category?: string): Promise<HybridSearchResult> => {
    const strategy = hybridSearchService.determineSearchStrategy(query);
    console.log(`Using search strategy: ${strategy} for query: ${query}`);

    let localResults: RegulatoryEntry[] = [];
    let liveResults: LiveSearchResult[] = [];

    try {
      // Get local database results (unless live_only)
      if (strategy !== 'live_only') {
        console.log('Searching local database...');
        localResults = await searchService.search(query, category);
      }

      // Get live search results (unless local_only)
      if (strategy !== 'local_only') {
        console.log('Performing live search...');
        
        // Determine which live search method to use
        if (query.toLowerCase().includes('market') || query.toLowerCase().includes('trading')) {
          const liveResponse = await liveSearchService.searchMarketConditions(query);
          liveResults = liveResponse.results;
        } else {
          const liveResponse = await liveSearchService.searchRegulatory(query);
          liveResults = liveResponse.results;
        }
      }

      return {
        localResults,
        liveResults,
        searchStrategy: strategy,
        query
      };
    } catch (error) {
      console.error('Hybrid search error:', error);
      
      // Fallback to local search only
      if (localResults.length === 0 && strategy !== 'local_only') {
        console.log('Falling back to local search only');
        localResults = await searchService.search(query, category);
      }

      return {
        localResults,
        liveResults: [],
        searchStrategy: 'local_only',
        query
      };
    }
  },

  /**
   * Format hybrid search results for AI context
   */
  formatResultsForContext: (results: HybridSearchResult): string => {
    let context = '';

    if (results.localResults.length > 0) {
      context += '=== REGULATORY DATABASE RESULTS ===\n\n';
      results.localResults.forEach((result, index) => {
        context += `${index + 1}. ${result.title}\n`;
        context += `Source: ${result.source}\n`;
        context += `Content: ${result.content.substring(0, 500)}...\n\n`;
      });
    }

    if (results.liveResults.length > 0) {
      context += '=== LIVE SEARCH RESULTS (Current Information) ===\n\n';
      results.liveResults.forEach((result, index) => {
        context += `${index + 1}. ${result.title}\n`;
        context += `URL: ${result.url}\n`;
        if (result.published_date) {
          context += `Published: ${result.published_date}\n`;
        }
        context += `Content: ${result.content.substring(0, 500)}...\n\n`;
      });
    }

    return context;
  }
};

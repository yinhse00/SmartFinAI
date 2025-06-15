
import { supabase } from '@/integrations/supabase/client';
import { QueryAnalysis } from './queryIntelligenceService';

export interface SearchResult {
  tableIndex: string;
  results: any[];
  relevanceScore: number;
  searchTime: number;
}

export interface CombinedSearchResults {
  totalResults: number;
  searchResults: SearchResult[];
  executionTime: number;
  searchStrategy: string;
}

// Define valid table names based on the database schema
type ValidTableName = 
  | 'listingrule_new_faq'
  | 'listingrule_listed_faq' 
  | 'listingrule_new_gl'
  | 'listingrule_new_ld'
  | 'announcement_pre_vetting_requirements'
  | 'mb_listingrule_documents'
  | 'regulatory_categories'
  | 'regulatory_provisions'
  | 'rule_keywords'
  | 'search_index';

/**
 * Service for routing searches to appropriate database tables based on query analysis
 */
export const searchIndexRoutingService = {
  /**
   * Execute parallel searches across relevant tables
   */
  executeParallelSearches: async (
    query: string, 
    analysis: QueryAnalysis
  ): Promise<CombinedSearchResults> => {
    const startTime = Date.now();
    console.log('Executing parallel searches for tables:', analysis.relevantTables);
    
    // If no specific tables identified, search all major tables
    const tablesToSearch = analysis.relevantTables.length > 0 
      ? analysis.relevantTables 
      : ['listingrule_new_faq', 'listingrule_listed_faq', 'listingrule_new_gl', 'listingrule_new_ld'];
    
    // Filter and validate table names
    const validTables = tablesToSearch.filter(searchIndexRoutingService.isValidTableName);
    
    // Create search promises for parallel execution
    const searchPromises = validTables.map(async (tableIndex) => {
      return searchIndexRoutingService.searchSpecificTable(query, tableIndex, analysis);
    });
    
    try {
      // Execute all searches in parallel
      const searchResults = await Promise.all(searchPromises);
      
      // Filter out empty results and sort by relevance
      const validResults = searchResults
        .filter(result => result.results.length > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      const totalResults = validResults.reduce((sum, result) => sum + result.results.length, 0);
      const executionTime = Date.now() - startTime;
      
      console.log(`Parallel search completed: ${totalResults} results from ${validResults.length} tables in ${executionTime}ms`);
      
      return {
        totalResults,
        searchResults: validResults,
        executionTime,
        searchStrategy: `parallel_search_${validTables.length}_tables`
      };
      
    } catch (error) {
      console.error('Error in parallel searches:', error);
      return {
        totalResults: 0,
        searchResults: [],
        executionTime: Date.now() - startTime,
        searchStrategy: 'parallel_search_failed'
      };
    }
  },

  /**
   * Check if a table name is valid
   */
  isValidTableName: (tableName: string): tableName is ValidTableName => {
    const validTables: ValidTableName[] = [
      'listingrule_new_faq',
      'listingrule_listed_faq',
      'listingrule_new_gl', 
      'listingrule_new_ld',
      'announcement_pre_vetting_requirements',
      'mb_listingrule_documents',
      'regulatory_categories',
      'regulatory_provisions',
      'rule_keywords',
      'search_index'
    ];
    return validTables.includes(tableName as ValidTableName);
  },

  /**
   * Search a specific table based on query and analysis
   */
  searchSpecificTable: async (
    query: string, 
    tableIndex: string, 
    analysis: QueryAnalysis
  ): Promise<SearchResult> => {
    const searchStart = Date.now();
    
    try {
      console.log(`Searching table: ${tableIndex}`);
      
      // Validate table name before querying
      if (!searchIndexRoutingService.isValidTableName(tableIndex)) {
        console.error(`Invalid table name: ${tableIndex}`);
        return {
          tableIndex,
          results: [],
          relevanceScore: 0,
          searchTime: Date.now() - searchStart
        };
      }
      
      // Build dynamic query based on table structure
      let supabaseQuery = supabase.from(tableIndex as ValidTableName).select('*');
      
      // Apply filters based on analysis
      const keywords = analysis.keywords.filter(keyword => keyword.length > 2);
      
      // Search in multiple fields depending on table structure
      if (keywords.length > 0) {
        const searchTerm = keywords.join(' ');
        
        // Try different field combinations based on common table structures
        if (tableIndex.includes('faq')) {
          supabaseQuery = supabaseQuery.or(
            `particulars.ilike.%${searchTerm}%,faqtopic.ilike.%${searchTerm}%,topic.ilike.%${searchTerm}%`
          );
        } else if (tableIndex.includes('_gl') || tableIndex.includes('_ld')) {
          supabaseQuery = supabaseQuery.or(
            `particulars.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%,mblistingrules_Topics.ilike.%${searchTerm}%`
          );
        } else {
          // Generic search for other tables
          supabaseQuery = supabaseQuery.or(
            `particulars.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%`
          );
        }
      }
      
      // Limit results to prevent overwhelming responses
      supabaseQuery = supabaseQuery.limit(10);
      
      const { data, error } = await supabaseQuery;
      
      if (error) {
        console.error(`Error searching ${tableIndex}:`, error);
        return {
          tableIndex,
          results: [],
          relevanceScore: 0,
          searchTime: Date.now() - searchStart
        };
      }
      
      // Calculate relevance score based on result count and intent match
      const relevanceScore = searchIndexRoutingService.calculateRelevanceScore(
        data || [], 
        tableIndex, 
        analysis
      );
      
      return {
        tableIndex,
        results: data || [],
        relevanceScore,
        searchTime: Date.now() - searchStart
      };
      
    } catch (error) {
      console.error(`Error searching table ${tableIndex}:`, error);
      return {
        tableIndex,
        results: [],
        relevanceScore: 0,
        searchTime: Date.now() - searchStart
      };
    }
  },

  /**
   * Calculate relevance score for search results
   */
  calculateRelevanceScore: (results: any[], tableIndex: string, analysis: QueryAnalysis): number => {
    if (results.length === 0) return 0;
    
    let baseScore = results.length * 0.1; // Base score from result count
    
    // Boost score based on intent-table alignment
    if (analysis.intent === 'faq' && tableIndex.includes('faq')) {
      baseScore *= 1.5;
    }
    if (analysis.intent === 'timetable' && tableIndex.includes('timetable')) {
      baseScore *= 1.5;
    }
    if (analysis.intent === 'documentation' && tableIndex.includes('documentation')) {
      baseScore *= 1.5;
    }
    
    // Boost score based on target party alignment
    if (analysis.targetParty === 'new_listing_applicants' && tableIndex.includes('new')) {
      baseScore *= 1.2;
    }
    if (analysis.targetParty === 'listed_companies' && tableIndex.includes('listed')) {
      baseScore *= 1.2;
    }
    
    return Math.min(baseScore, 1.0); // Cap at 1.0
  },

  /**
   * Format search results into readable context
   */
  formatSearchResultsToContext: (searchResults: CombinedSearchResults): string => {
    if (searchResults.totalResults === 0) {
      return '';
    }
    
    let formattedContext = `\n--- DATABASE SEARCH RESULTS (${searchResults.totalResults} results) ---\n`;
    
    searchResults.searchResults.forEach((tableResult, index) => {
      if (tableResult.results.length > 0) {
        formattedContext += `\n### ${tableResult.tableIndex.toUpperCase()} (${tableResult.results.length} results, relevance: ${Math.round(tableResult.relevanceScore * 100)}%)\n`;
        
        tableResult.results.slice(0, 5).forEach((result, idx) => {
          // Extract key information based on table structure
          let title = result.title || result.topic || result.faqtopic || `Entry ${idx + 1}`;
          let content = result.particulars || result.description || result.content || '';
          let reference = result.reference_no || result.reference_nos || result.chapter || '';
          
          formattedContext += `\n**${title}**`;
          if (reference) formattedContext += ` (${reference})`;
          if (content) formattedContext += `\n${content.substring(0, 300)}${content.length > 300 ? '...' : ''}`;
          formattedContext += '\n';
        });
      }
    });
    
    formattedContext += `\n--- End Database Results (Search time: ${searchResults.executionTime}ms) ---\n`;
    
    return formattedContext;
  }
};

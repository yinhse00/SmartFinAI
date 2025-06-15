import { supabase } from '@/integrations/supabase/client';
import { QueryAnalysis } from './queryIntelligenceService';

export interface SearchResult {
  tableIndex: string;
  results: any[];
  relevanceScore: number;
  searchTime: number;
  searchStrategy: string;
}

export interface CombinedSearchResults {
  totalResults: number;
  searchResults: SearchResult[];
  executionTime: number;
  searchStrategy: string;
}

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
    
    const tablesToSearch = analysis.relevantTables;
    
    // Create search promises for parallel execution
    const searchPromises = tablesToSearch.map(async (tableIndex) => {
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
        searchStrategy: `parallel_search_${tablesToSearch.length}_tables`
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
   * Search a specific table based on query and analysis
   */
  searchSpecificTable: async (
    query: string, 
    tableIndex: string, 
    analysis: QueryAnalysis
  ): Promise<SearchResult> => {
    const searchStart = Date.now();
    let searchStrategy = `direct_search_on_${tableIndex}`;
    
    try {
      console.log(`Searching table: ${tableIndex}`);
      
      // Build dynamic query based on table structure
      // Use 'as any' to allow dynamic table names, bypassing strict typing.
      let supabaseQuery = supabase.from(tableIndex as any).select('*');
      
      // Apply filters based on analysis
      const keywords = analysis.keywords.filter(keyword => keyword.length > 2);
      
      // Search in multiple fields depending on table structure
      if (keywords.length > 0) {
        const searchTerm = keywords.join(' ');
        searchStrategy = `keyword_search_on_${tableIndex}`;
        
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
          searchTime: Date.now() - searchStart,
          searchStrategy: 'search_error'
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
        searchTime: Date.now() - searchStart,
        searchStrategy
      };
      
    } catch (error) {
      console.error(`Error searching table ${tableIndex}:`, error);
      return {
        tableIndex,
        results: [],
        relevanceScore: 0,
        searchTime: Date.now() - searchStart,
        searchStrategy: 'search_exception'
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
   * Format search results into readable context with enhanced source attribution
   */
  formatSearchResultsToContext: (searchResults: CombinedSearchResults): string => {
    if (searchResults.totalResults === 0) {
      return '';
    }
    
    let formattedContext = `DATABASE SEARCH RESULTS: ${searchResults.totalResults} authoritative entries found\n`;
    formattedContext += `Search Strategy: ${searchResults.searchStrategy} | Execution Time: ${searchResults.executionTime}ms\n\n`;
    
    searchResults.searchResults.forEach((tableResult, index) => {
      if (tableResult.results.length > 0) {
        // Enhanced table name formatting with source classification
        const tableDisplayName = searchIndexRoutingService.getTableDisplayName(tableResult.tableIndex);
        const sourceType = searchIndexRoutingService.getSourceType(tableResult.tableIndex);
        
        formattedContext += `### ${tableDisplayName} ${sourceType}\n`;
        formattedContext += `Relevance: ${Math.round(tableResult.relevanceScore * 100)}% | Results: ${tableResult.results.length}\n\n`;
        
        tableResult.results.slice(0, 5).forEach((result, idx) => {
          // Extract key information with enhanced formatting
          let title = result.title || result.topic || result.faqtopic || `Entry ${idx + 1}`;
          let content = result.particulars || result.description || result.content || '';
          let reference = result.reference_no || result.reference_nos || result.chapter || '';
          
          formattedContext += `**${title}**`;
          if (reference) formattedContext += ` (Reference: ${reference})`;
          formattedContext += `\n`;
          
          if (content) {
            // Clean and format content
            const cleanContent = content.replace(/\s+/g, ' ').trim();
            formattedContext += `${cleanContent.substring(0, 400)}${cleanContent.length > 400 ? '...' : ''}`;
          }
          formattedContext += '\n\n';
        });
        
        if (tableResult.results.length > 5) {
          formattedContext += `... and ${tableResult.results.length - 5} more entries from ${tableDisplayName}\n\n`;
        }
      }
    });
    
    formattedContext += `--- End Database Results | Total Processing Time: ${searchResults.executionTime}ms ---\n`;
    
    return formattedContext;
  },

  /**
   * Get display name for table with proper formatting
   */
  getTableDisplayName: (tableIndex: string): string => {
    const tableNames: Record<string, string> = {
      'listingrule_new_faq': 'New Listing Applicant FAQs',
      'listingrule_listed_faq': 'Listed Company FAQs',
      'listingrule_new_gl': 'New Listing Guidance Letters',
      'listingrule_new_ld': 'New Listing Decisions',
      'announcement_pre_vetting_requirements': 'Pre-Vetting Requirements',
      'mb_listingrule_documents': 'Listing Rule Documents',
      'regulatory_categories': 'Regulatory Categories',
      'regulatory_provisions': 'Regulatory Provisions',
      'rule_keywords': 'Rule Keywords',
      'search_index': 'Search Index'
    };
    return tableNames[tableIndex] || tableIndex.toUpperCase();
  },

  /**
   * Get source type classification for proper attribution
   */
  getSourceType: (tableIndex: string): string => {
    if (tableIndex.includes('documents')) return '(Official Documents Database)';
    return '(Regulatory Database)';
  }
};

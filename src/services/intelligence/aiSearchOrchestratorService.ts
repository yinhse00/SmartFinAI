import { searchIndexRoutingService, CombinedSearchResults } from './searchIndexRoutingService';
import { queryIntelligenceService, AiSearchStrategy } from './queryIntelligenceService';
import { aiSearchStrategyToQueryAnalysis } from './aiSearchStrategyConverter';

/**
 * Service to orchestrate search using AI-driven discovery and prioritization.
 */
export const aiSearchOrchestratorService = {
  /**
   * Executes a search by first using AI to discover and prioritize relevant tables,
   * then performing targeted parallel searches.
   */
  executeAiDrivenSearch: async (
    query: string,
    searchFocus?: 'takeovers' | 'listing_rules'
  ): Promise<CombinedSearchResults & { aiStrategy?: AiSearchStrategy, queryAnalysis?: QueryAnalysis }> => {
    console.log(`Starting AI-driven search for query: "${query}" with focus: ${searchFocus || 'none'}`);
    const startTime = Date.now();
    try {
      // Step 1: Get content previews from the search index.
      const searchIndexPreviews = await searchIndexRoutingService.getSearchIndexPreviews();

      if (Object.keys(searchIndexPreviews).length === 0) {
        console.warn('Search index is empty. Cannot perform AI-driven search.');
        return {
          totalResults: 0,
          searchResults: [],
          executionTime: Date.now() - startTime,
          searchStrategy: 'ai_orchestrator_failed_no_index',
        };
      }

      // Step 2: Use AI to determine the search strategy.
      const aiStrategy = await queryIntelligenceService.getAiSearchStrategy(query, searchIndexPreviews, searchFocus);
      console.log('AI Search Strategy Reasoning:', aiStrategy.reasoning);

      // Step 2.1: Convert aiStrategy to QueryAnalysis
      const queryAnalysis = aiSearchStrategyToQueryAnalysis(aiStrategy);

      // Step 3: Execute parallel searches based on the AI-prioritized tables.
      if (aiStrategy.prioritizedTables.length === 0) {
        console.log('AI recommended no tables to search.');
        return {
          totalResults: 0,
          searchResults: [],
          executionTime: Date.now() - startTime,
          searchStrategy: 'ai_orchestrator_no_tables_recommended',
          aiStrategy,
          queryAnalysis,
        };
      }

      const searchResults = await searchIndexRoutingService.executeParallelSearches(
        query,
        queryAnalysis
      );

      const totalExecutionTime = Date.now() - startTime;
      console.log(`AI-driven search completed in ${totalExecutionTime}ms`);

      return {
        ...searchResults,
        executionTime: totalExecutionTime,
        searchStrategy: `ai_orchestrated_${aiStrategy.prioritizedTables.length}_tables`,
        aiStrategy,
        queryAnalysis,
      };
    } catch (error) {
      console.error('Error in AI-driven search orchestrator:', error);
      const executionTime = Date.now() - startTime;
      return {
        totalResults: 0,
        searchResults: [],
        executionTime,
        searchStrategy: 'ai_orchestrator_error',
      };
    }
  },
};

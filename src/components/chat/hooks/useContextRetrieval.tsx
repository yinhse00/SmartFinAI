import { useState } from 'react';
import { hybridSearchService } from '@/services/search/hybridSearchService';
import { contextService } from '@/services/regulatory/contextService';

export const useContextRetrieval = () => {
  const [isRetrievingContext, setIsRetrievingContext] = useState(false);

  const retrieveRegulatoryContext = async (
    query: string,
    prioritizeFAQ: boolean = false,
    options?: { useHybridSearch?: boolean }
  ) => {
    console.log('Starting enhanced context retrieval with hybrid search...');
    setIsRetrievingContext(true);
    
    const startTime = Date.now();
    
    try {
      let context = '';
      let reasoning = '';
      let searchStrategy = 'local_only';
      let enhancedContext: any = {};

      // Use hybrid search if enabled (default for current information queries)
      if (options?.useHybridSearch !== false && hybridSearchService.needsLiveSearch(query)) {
        console.log('Using hybrid search for current information...');
        
        const hybridResults = await hybridSearchService.search(query);
        context = hybridSearchService.formatResultsForContext(hybridResults);
        searchStrategy = hybridResults.searchStrategy;
        
        reasoning = `Used ${searchStrategy} search strategy. Found ${hybridResults.localResults.length} regulatory database entries and ${hybridResults.liveResults.length} live search results.`;
        
        enhancedContext = {
          hasLiveResults: hybridResults.liveResults.length > 0,
          liveResultsCount: hybridResults.liveResults.length,
          localResultsCount: hybridResults.localResults.length,
          searchStrategy: hybridResults.searchStrategy
        };
      } else {
        // Fallback to existing context retrieval logic
        const contextResult = await contextService.getRegulatoryContext(query, { prioritizeFAQ });
        context = contextResult.context;
        reasoning = contextResult.reasoning;
        searchStrategy = contextResult.searchStrategy || 'local_only';
      }

      const contextTime = Date.now() - startTime;
      console.log(`Context retrieval completed in ${contextTime}ms using ${searchStrategy} strategy`);

      return {
        regulatoryContext: context,
        reasoning,
        contextTime,
        usedSummaryIndex: false,
        searchStrategy,
        enhancedContext
      };
    } catch (error) {
      console.error('Error in enhanced context retrieval:', error);
      
      // Fallback to local search only
      try {
        const fallbackResult = await contextService.getRegulatoryContext(query);
        return {
          regulatoryContext: fallbackResult.context,
          reasoning: `Fallback to local search due to error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          contextTime: Date.now() - startTime,
          usedSummaryIndex: false,
          searchStrategy: 'local_only',
          enhancedContext: {}
        };
      } catch (fallbackError) {
        console.error('Fallback context retrieval also failed:', fallbackError);
        return {
          regulatoryContext: '',
          reasoning: 'Context retrieval failed',
          contextTime: Date.now() - startTime,
          usedSummaryIndex: false,
          searchStrategy: 'failed',
          enhancedContext: {}
        };
      }
    } finally {
      setIsRetrievingContext(false);
    }
  };

  return {
    retrieveRegulatoryContext,
    isRetrievingContext
  };
};


import { parallelContextService } from '@/services/regulatory/context/parallelContextService';
import { smartCacheService } from '@/services/cache/smartCacheService';

export const useOptimizedContextRetrieval = () => {
  const retrieveOptimizedContext = async (
    queryText: string,
    isFaqQuery: boolean
  ) => {
    const contextStart = Date.now();
    
    try {
      console.log('Starting optimized context retrieval...');
      
      // Check cache first
      const cacheKey = `${queryText.substring(0, 100)}-${isFaqQuery ? 'faq' : 'general'}`;
      const cachedContext = smartCacheService.get(cacheKey, 'context');
      
      if (cachedContext) {
        console.log('Using cached context for faster response');
        return {
          ...cachedContext,
          contextTime: Date.now() - contextStart,
          fromCache: true
        };
      }
      
      // Use parallel context service for faster retrieval
      const contextResult = await parallelContextService.getContextInParallel(queryText, {
        isFaqQuery,
        metadata: { 
          optimized: true,
          useParallelProcessing: true
        }
      });
      
      const contextTime = Date.now() - contextStart;
      
      // Prepare response
      const response = {
        regulatoryContext: contextResult.context,
        reasoning: contextResult.reasoning,
        contextTime,
        usedSummaryIndex: false,
        searchStrategy: 'parallel_optimized',
        enhancedContext: {
          vettingInfo: { isRequired: false },
          guidanceValidation: { 
            hasRelevantGuidance: Boolean(contextResult.guidanceContext),
            matches: contextResult.sourceMaterials || []
          }
        }
      };
      
      // Cache the result
      smartCacheService.set(cacheKey, response, 'context');
      
      console.log(`Optimized context retrieved in ${contextTime}ms`);
      
      return response;
    } catch (error) {
      console.error('Error in optimized context retrieval:', error);
      
      return {
        regulatoryContext: '',
        reasoning: 'Optimized context retrieval failed',
        contextTime: Date.now() - contextStart,
        usedSummaryIndex: false,
        searchStrategy: 'fallback'
      };
    }
  };

  return {
    retrieveOptimizedContext
  };
};

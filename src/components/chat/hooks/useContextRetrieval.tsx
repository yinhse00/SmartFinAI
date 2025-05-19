
import { useState } from 'react';
import { grokService } from '@/services/grokService';
import { useToast } from '@/hooks/use-toast';
import { parallelQueryProcessor } from '@/services/response/core/parallelQueryProcessor';

// Cache for context retrieval
const contextCache = new Map<string, {
  result: any,
  timestamp: number
}>();

// Cache expiration time (10 minutes)
const CACHE_EXPIRATION_MS = 10 * 60 * 1000;

export const useContextRetrieval = () => {
  const { toast } = useToast();
  const [lastRegulationSearchTime, setLastRegulationSearchTime] = useState<number>(0);

  /**
   * Enhanced regulatory context retrieval using parallel processing with caching
   */
  const retrieveRegulatoryContext = async (
    queryText: string,
    isPreliminaryAssessment: boolean = false
  ) => {
    console.log(`Retrieving regulatory context for query${isPreliminaryAssessment ? " (parallel assessment)" : ""}`);
    
    // Generate cache key from query text
    const cacheKey = queryText.toLowerCase().substring(0, 100);
    
    // Check cache first for faster response
    const cachedContext = contextCache.get(cacheKey);
    if (cachedContext && (Date.now() - cachedContext.timestamp < CACHE_EXPIRATION_MS)) {
      console.log('Using cached regulatory context');
      // Return cached result with cache hit metadata
      return {
        ...cachedContext.result,
        cacheHit: true,
        cacheAge: Math.round((Date.now() - cachedContext.timestamp) / 1000)
      };
    }
    
    // Detect if this is a new listing or listed issuer query
    const isNewListingQuery = queryText.toLowerCase().includes('new listing') ||
      queryText.toLowerCase().includes('ipo') ||
      queryText.toLowerCase().includes('initial public offering') ||
      queryText.toLowerCase().includes('listing applicant');
      
    console.log(`Query classified as ${isNewListingQuery ? 'NEW LISTING' : 'LISTED ISSUER'} query`);
    
    const searchStart = Date.now();
    
    try {
      // For preliminary assessment, use our enhanced parallel approach
      if (isPreliminaryAssessment) {
        console.log('Using parallel query processing for comprehensive assessment');
        const result = await parallelQueryProcessor.processQueryInParallel(queryText);
        
        const contextTime = Date.now() - searchStart;
        console.log(`Parallel context retrieval completed in ${contextTime}ms`);
        
        // Cache the result
        const resultToCache = {
          regulatoryContext: result.optimizedContext,
          reasoning: result.assessment.reasoning,
          contextTime,
          categories: result.assessment.categories,
          estimatedComplexity: result.assessment.estimatedComplexity,
          contexts: result.contexts,
          isNewListingQuery: result.assessment.isNewListingQuery || isNewListingQuery
        };
        
        contextCache.set(cacheKey, {
          result: resultToCache,
          timestamp: Date.now()
        });
        
        return resultToCache;
      }
      
      // For non-preliminary assessments, call the regular context service
      // which now has integrated parallel processing capabilities
      const contextResponse = await grokService.getRegulatoryContext(
        queryText, 
        {
          isPreliminaryAssessment,
          metadata: {
            processingStage: isPreliminaryAssessment ? 'preliminary' : 'main',
            isInitialAssessment: isPreliminaryAssessment,
            isNewListingQuery
          }
        }
      );

      let regulatoryContext = '';
      let reasoning = '';
      let usedSummaryIndex = false;
      let searchStrategy = 'direct';
      let categories = [];
      
      if (contextResponse) {
        if (typeof contextResponse === 'string') {
          regulatoryContext = contextResponse;
        } else if (typeof contextResponse === 'object') {
          regulatoryContext = contextResponse.context || contextResponse.regulatoryContext || '';
          reasoning = contextResponse.reasoning || '';
          usedSummaryIndex = contextResponse.usedSummaryIndex || false;
          searchStrategy = contextResponse.searchStrategy || 'direct';
          categories = contextResponse.categories || [];
        }
      }

      const contextTime = Date.now() - searchStart;
      console.log(`Context retrieval completed in ${contextTime}ms`);

      if (regulatoryContext.trim() === '') {
        console.log('No specific regulatory context found for the query');
      } else {
        console.log('Found relevant regulatory context');
      }
      
      // Create result object
      const result = {
        regulatoryContext,
        reasoning,
        contextTime,
        usedSummaryIndex,
        searchStrategy,
        categories,
        isNewListingQuery
      };
      
      // Cache the result if we have content
      if (regulatoryContext.trim() !== '') {
        contextCache.set(cacheKey, {
          result,
          timestamp: Date.now()
        });
        
        // Limit cache size
        if (contextCache.size > 25) {
          // Delete oldest entry
          const oldestKey = Array.from(contextCache.keys())[0];
          contextCache.delete(oldestKey);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error retrieving regulatory context:', error);
      
      const contextTime = Date.now() - searchStart;
      console.log(`Context retrieval failed after ${contextTime}ms`);
      
      return {
        regulatoryContext: '',
        reasoning: `Error retrieving context: ${error instanceof Error ? error.message : String(error)}`,
        contextTime,
        usedSummaryIndex: false,
        searchStrategy: 'failed',
        error,
        isNewListingQuery
      };
    }
  };

  // Function to manually clear the context cache
  const clearContextCache = () => {
    contextCache.clear();
    console.log('Context cache cleared');
  };

  return {
    retrieveRegulatoryContext,
    clearContextCache
  };
};

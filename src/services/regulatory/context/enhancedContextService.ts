
import { contextSearchOrchestrator } from './contextSearchOrchestrator';
import { faqSearchService } from './faqSearchService';

// Cache for FAQ context
const faqCache = new Map<string, {
  result: any,
  timestamp: number
}>();

// Cache expiration (15 minutes)
const FAQ_CACHE_EXPIRATION = 15 * 60 * 1000;

/**
 * Specialized service for enhanced regulatory context with reasoning
 */
export const enhancedContextService = {
  /**
   * Enhanced regulatory context retrieval with specialized financial semantic search
   * This is used by the comprehensive context service
   */
  getRegulatoryContextWithReasoning: async (query: string) => {
    try {
      console.group('Retrieving Specialized Financial Context');
      console.log('Original Query:', query);
      
      // Generate cache key
      const cacheKey = query.toLowerCase().substring(0, 100);
      
      // Check cache first for faster response
      const cachedContext = faqCache.get(cacheKey);
      if (cachedContext && (Date.now() - cachedContext.timestamp < FAQ_CACHE_EXPIRATION)) {
        console.log('Using cached context');
        console.groupEnd();
        return {
          ...cachedContext.result,
          cacheHit: true,
          cacheAge: Math.round((Date.now() - cachedContext.timestamp) / 1000)
        };
      }
      
      // Check if this might be FAQ related
      const isFaqQuery = query.toLowerCase().includes('faq') || 
                         query.toLowerCase().includes('continuing obligation') ||
                         Boolean(query.match(/\b10\.4\b/));
                         
      if (isFaqQuery) {
        console.log('Detected FAQ/continuing obligations query, prioritizing relevant documents');
        // Try to get FAQ context first for better performance
        const faqResponse = await faqSearchService.getFaqContext(query);
        
        // If FAQ context was found, cache and return it immediately
        if (faqResponse.context) {
          // Cache the result
          faqCache.set(cacheKey, {
            result: faqResponse,
            timestamp: Date.now()
          });
          
          // Limit cache size
          if (faqCache.size > 20) {
            const oldestKey = Array.from(faqCache.keys())[0];
            faqCache.delete(oldestKey);
          }
          
          console.groupEnd();
          return faqResponse;
        }
      }
      
      // For all other queries, use the comprehensive search orchestrator
      const result = await contextSearchOrchestrator.executeComprehensiveSearch(query);
      
      // Cache the result
      faqCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });
      
      // Limit cache size
      if (faqCache.size > 20) {
        const oldestKey = Array.from(faqCache.keys())[0];
        faqCache.delete(oldestKey);
      }
      
      console.groupEnd();
      return result;
    } catch (error) {
      console.error('Error retrieving specialized financial context:', error);
      console.groupEnd();
      return {
        context: 'Error fetching financial regulatory context',
        reasoning: 'Unable to search specialized financial database due to an unexpected error.'
      };
    }
  },
  
  // Function to manually clear the FAQ context cache
  clearFaqCache: () => {
    faqCache.clear();
    console.log('FAQ context cache cleared');
  }
};

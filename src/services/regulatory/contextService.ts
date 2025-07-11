
import { grokApiService } from '../api/grokApiService';
import { parallelQueryProcessor } from '../response/core/parallelQueryProcessor';

/**
 * Optimized service for retrieving regulatory context with faster response times
 * Uses only Grok's built-in knowledge with no database dependencies
 */
export const contextService = {
  getRegulatoryContext: async (
    query: string,
    options?: { isPreliminaryAssessment?: boolean, metadata?: any }
  ) => {
    try {
      // Detect query type for optimization
      const isIFAQuery = query.toLowerCase().includes('ifa') || 
                       query.toLowerCase().includes('independent financial adviser');
                       
      const isTakeoversQuery = query.toLowerCase().includes('takeover') || 
                              query.toLowerCase().includes('general offer');
      
      // Set specialized handling for specific query types      
      const metadata = {
        ...(options?.metadata || {}),
        specializedQuery: isIFAQuery ? 'ifa' : (isTakeoversQuery ? 'takeovers' : undefined),
        model: isIFAQuery || isTakeoversQuery ? 'grok-4-0709' : 'grok-3-mini-beta',
        processingStage: options?.isPreliminaryAssessment ? 'preliminary' : 'main',
        hasRegulatoryDatabase: false // Never use database files
      };
      
      // Use faster path when possible, parallel for complex queries
      if (options?.isPreliminaryAssessment === true || options?.metadata?.useParallelProcessing) {
        const { optimizedContext } = await parallelQueryProcessor.processQueryInParallel(query);
        return optimizedContext;
      }
      
      // Direct path for most queries - significantly faster
      const response = await grokApiService.getRegulatoryContext(
        query, 
        false, 
        metadata
      );
      
      return response;
    } catch (error) {
      console.error('Error in regulatory context service:', error);
      return '';
    }
  }
};


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
      
      // Check for complex financial queries
      const isComplexQuery = query.length > 150 ||
                           query.toLowerCase().includes('rights issue') ||
                           query.toLowerCase().includes('timetable') ||
                           query.toLowerCase().includes('connected transaction') ||
                           query.toLowerCase().includes('chapter 14') ||
                           query.toLowerCase().includes('chapter 14a');
      
      // Always use beta model for regulatory content and complex queries
      const shouldUseBetaModel = isIFAQuery || isTakeoversQuery || isComplexQuery || 
                               options?.isPreliminaryAssessment === true;
      
      // Set specialized handling for specific query types      
      const metadata = {
        ...(options?.metadata || {}),
        specializedQuery: isIFAQuery ? 'ifa' : (isTakeoversQuery ? 'takeovers' : undefined),
        model: shouldUseBetaModel ? 'grok-3-beta' : 'grok-3-mini',
        processingStage: options?.isPreliminaryAssessment ? 'preliminary' : 'main',
        hasRegulatoryDatabase: false, // Never use database files
        forceFullModel: isComplexQuery || isIFAQuery || isTakeoversQuery // Force full model for important queries
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

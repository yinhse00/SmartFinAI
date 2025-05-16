
import { grokApiService } from '../api/grokApiService';
import { parallelQueryProcessor } from '../response/core/parallelQueryProcessor';

/**
 * Service for retrieving regulatory context with enhanced model selection and parallel processing
 * Optimized to use only Grok 3's built-in knowledge without database dependencies
 */
export const contextService = {
  /**
   * Fetches regulatory context using only Grok's knowledge base
   */
  getRegulatoryContext: async (
    query: string,
    options?: { isPreliminaryAssessment?: boolean, metadata?: any }
  ) => {
    try {
      console.log(`Getting regulatory context for: ${query}`);
      
      // Check for special query types to customize the approach
      const isIFAQuery = query.toLowerCase().includes('ifa') || 
                         query.toLowerCase().includes('independent financial adviser');
                         
      const isTakeoversQuery = query.toLowerCase().includes('takeover') || 
                              query.toLowerCase().includes('general offer') ||
                              query.toLowerCase().includes('mandatory offer');
                              
      // For IFA queries, ensure we add specialized handling
      if (isIFAQuery) {
        console.log('IFA query detected - using specialized handling');
        options = {
          ...(options || {}),
          metadata: {
            ...(options?.metadata || {}),
            specializedQuery: 'ifa',
            model: 'grok-3-beta' // Use more capable model for specialized queries
          }
        };
      }
      
      // For takeovers queries, ensure we add specialized handling
      if (isTakeoversQuery) {
        console.log('Takeovers query detected - using specialized handling');
        options = {
          ...(options || {}),
          metadata: {
            ...(options?.metadata || {}),
            specializedQuery: 'takeovers',
            model: 'grok-3-beta' // Use more capable model for specialized queries
          }
        };
      }
      
      // For preliminary assessment, or if explicitly requested, use parallel processing
      const isPreliminaryAssessment = options?.isPreliminaryAssessment === true;
      const useParallelProcessing = options?.metadata?.useParallelProcessing === true || isPreliminaryAssessment;
      
      // If this is an initial assessment, use parallel query processor for comprehensive analysis
      if (useParallelProcessing) {
        console.log('Using parallel query processing for context retrieval');
        const { optimizedContext, assessment } = await parallelQueryProcessor.processQueryInParallel(query);
        
        // Return structured result with context and reasoning
        return {
          context: optimizedContext,
          regulatoryContext: optimizedContext, // For backward compatibility
          reasoning: assessment.reasoning,
          categories: assessment.categories,
          estimatedComplexity: assessment.estimatedComplexity
        };
      }
      
      // Build request metadata
      const metadata = {
        ...(options?.metadata || {}),
        processingStage: isPreliminaryAssessment ? 'preliminary' : 'main',
        isInitialAssessment: isPreliminaryAssessment,
        hasRegulatoryDatabase: false, // Always false since we're removing database dependency
        // Select model based on processing stage and query type
        model: isIFAQuery || isTakeoversQuery ? 'grok-3-beta' : 
              (isPreliminaryAssessment ? 'grok-3-beta' : 'grok-3-mini-beta')
      };
      
      // Call API to get regulatory context, leveraging only Grok's native knowledge
      const response = await grokApiService.getRegulatoryContext(
        query, 
        false, // hasRegulatoryDatabase is always false
        metadata
      );
      
      return response;
    } catch (error) {
      console.error('Error in regulatory context service:', error);
      return '';
    }
  }
};

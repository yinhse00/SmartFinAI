
import { grokApiService } from '../api/grokApiService';
import { supabase } from '@/integrations/supabase/client';
import { parallelQueryProcessor } from '../response/core/parallelQueryProcessor';

/**
 * Service for retrieving regulatory context with enhanced model selection and parallel processing
 * Now optimized to use Grok 3's built-in knowledge
 */
export const contextService = {
  /**
   * Fetches regulatory context primarily using Grok's knowledge base
   * Now accepts options including isPreliminaryAssessment and metadata
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
      
      // Check if we have a regulatory database available (for compatibility with existing code)
      let hasRegulatoryDatabase = false;
      
      try {
        const { count, error } = await supabase
          .from('regulatory_provisions')
          .select('*', { count: 'exact', head: true });
        
        hasRegulatoryDatabase = !error && count !== null && count > 0;
      } catch (e) {
        console.log('Error checking regulatory database:', e);
        hasRegulatoryDatabase = false;
      }
      
      // Build request metadata
      const metadata = {
        ...(options?.metadata || {}),
        processingStage: isPreliminaryAssessment ? 'preliminary' : 'main',
        isInitialAssessment: isPreliminaryAssessment,
        hasRegulatoryDatabase,
        // Select model based on processing stage and query type
        model: isIFAQuery || isTakeoversQuery ? 'grok-3-beta' : 
              (isPreliminaryAssessment ? 'grok-3-beta' : 'grok-3-mini-beta')
      };
      
      // Call API to get regulatory context, leveraging Grok's native knowledge
      const response = await grokApiService.getRegulatoryContext(
        query, 
        hasRegulatoryDatabase,
        metadata
      );
      
      return response;
    } catch (error) {
      console.error('Error in regulatory context service:', error);
      return '';
    }
  }
};

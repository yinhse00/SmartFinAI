
import { grokApiService } from '../api/grokApiService';
import { supabase } from '@/integrations/supabase/client';
import { parallelQueryProcessor } from '../response/core/parallelQueryProcessor';

/**
 * Service for retrieving regulatory context with enhanced model selection and parallel processing
 */
export const contextService = {
  /**
   * Fetches regulatory context from the database or API with parallel processing
   * Now accepts options including isPreliminaryAssessment and metadata
   */
  getRegulatoryContext: async (
    query: string,
    options?: { isPreliminaryAssessment?: boolean, metadata?: any }
  ) => {
    try {
      console.log(`Getting regulatory context for: ${query}`);
      
      // Check if we have a regulatory database available
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
      
      // For specific category searches (used within parallel processing)
      if (options?.metadata?.category) {
        console.log(`Searching specific category: ${options.metadata.category}`);
      }
      
      // Build request metadata
      const metadata = {
        ...(options?.metadata || {}),
        processingStage: isPreliminaryAssessment ? 'preliminary' : 'main',
        isInitialAssessment: isPreliminaryAssessment,
        hasRegulatoryDatabase,
        // Select model based on processing stage
        model: isPreliminaryAssessment ? 'grok-3-beta' : 'grok-3-mini-beta'
      };
      
      // Call API to get regulatory context
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


import { grokApiService } from '../api/grokApiService';
import { supabase } from '@/integrations/supabase/client';

export const contextService = {
  /**
   * Fetches regulatory context from the database or API
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
      
      // For preliminary assessment, use advanced model
      const isPreliminaryAssessment = options?.isPreliminaryAssessment === true;
      
      // Build request metadata
      const metadata = {
        ...(options?.metadata || {}),
        processingStage: isPreliminaryAssessment ? 'preliminary' : 'main',
        isInitialAssessment: isPreliminaryAssessment,
        hasRegulatoryDatabase
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

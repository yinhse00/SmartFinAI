
import { supabase } from '@/integrations/supabase/client';
import { RegulationProvision } from '../types';

export const provisionService = {
  /**
   * Get all provisions
   */
  getAllProvisions: async (): Promise<RegulationProvision[]> => {
    const { data, error } = await supabase
      .from('regulatory_provisions')
      .select('*')
      .order('rule_number');
    
    if (error) {
      console.error('Error fetching provisions:', error);
      return [];
    }
    
    return data || [];
  },
  
  /**
   * Get provisions by chapter
   */
  getProvisionsByChapter: async (chapter: string): Promise<RegulationProvision[]> => {
    const { data, error } = await supabase
      .from('regulatory_provisions')
      .select('*')
      .eq('chapter', chapter)
      .order('rule_number');
    
    if (error) {
      console.error(`Error fetching provisions for chapter ${chapter}:`, error);
      return [];
    }
    
    return data || [];
  },
  
  /**
   * Add a single provision
   */
  addProvision: async (provision: Omit<RegulationProvision, 'id'>): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('regulatory_provisions')
        .insert(provision)
        .select('id')
        .single();
      
      if (error) {
        console.error('Error adding provision:', error);
        return null;
      }
      
      return data?.id || null;
    } catch (err) {
      console.error('Exception adding provision:', err);
      return null;
    }
  },
  
  /**
   * Add multiple provisions
   */
  addProvisions: async (provisions: Omit<RegulationProvision, 'id'>[]): Promise<number> => {
    if (!provisions || provisions.length === 0) {
      return 0;
    }
    
    try {
      // Add provisions one by one to avoid batch errors
      let addedCount = 0;
      for (const provision of provisions) {
        try {
          const result = await provisionService.addProvision(provision);
          if (result) {
            addedCount++;
          }
        } catch (err) {
          console.error('Error adding provision:', err);
        }
      }
      
      return addedCount;
    } catch (err) {
      console.error('Error adding provisions in batch:', err);
      return 0;
    }
  },

  /**
   * Get provisions by source document ID
   */
  getProvisionsBySourceDocument: async (sourceDocumentId: string): Promise<RegulationProvision[]> => {
    // If sourceDocumentId is empty, return empty array to avoid SQL errors
    if (!sourceDocumentId) {
      console.warn('Empty sourceDocumentId provided to getProvisionsBySourceDocument');
      return [];
    }
    
    try {
      const { data, error } = await supabase
        .from('regulatory_provisions')
        .select('*')
        .eq('source_document_id', sourceDocumentId);
      
      if (error) {
        console.error(`Error fetching provisions for document ${sourceDocumentId}:`, error);
        return [];
      }
      
      return data || [];
    } catch (err) {
      console.error(`Error fetching provisions for document ${sourceDocumentId}:`, err);
      return [];
    }
  }
};

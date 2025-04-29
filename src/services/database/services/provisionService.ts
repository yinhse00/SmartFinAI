
import { supabase } from '@/integrations/supabase/client';
import { RegulationProvision } from '../types/index';

/**
 * Service for managing regulatory provisions
 */
export const provisionService = {
  /**
   * Get all provisions for a specific chapter
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
   * Get all provisions (with optional limit)
   */
  getAllProvisions: async (limit: number = 1000): Promise<RegulationProvision[]> => {
    const { data, error } = await supabase
      .from('regulatory_provisions')
      .select('*')
      .order('chapter', { ascending: true })
      .order('rule_number', { ascending: true })
      .limit(limit);
    
    if (error) {
      console.error(`Error fetching all provisions:`, error);
      return [];
    }
    
    return data || [];
  },
  
  /**
   * Add a provision to the database
   */
  addProvision: async (provision: Omit<RegulationProvision, 'id'>): Promise<RegulationProvision | null> => {
    const { data, error } = await supabase
      .from('regulatory_provisions')
      .insert(provision)
      .select()
      .single();
    
    if (error) {
      console.error('Error adding provision:', error);
      return null;
    }
    
    return data;
  },
  
  /**
   * Add multiple provisions in a batch operation
   */
  addProvisions: async (provisions: Omit<RegulationProvision, 'id'>[]): Promise<number> => {
    const { data, error } = await supabase
      .from('regulatory_provisions')
      .insert(provisions);
    
    if (error) {
      console.error('Error adding provisions in batch:', error);
      return 0;
    }
    
    return provisions.length;
  },

  /**
   * Get provisions by source document ID
   */
  getProvisionsBySourceDocument: async (documentId: string): Promise<RegulationProvision[]> => {
    const { data, error } = await supabase
      .from('regulatory_provisions')
      .select('*')
      .eq('source_document_id', documentId);
    
    if (error) {
      console.error(`Error fetching provisions for document ${documentId}:`, error);
      return [];
    }
    
    return data || [];
  }
};

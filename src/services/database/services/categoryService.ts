
import { supabase } from '@/integrations/supabase/client';
import { RegulationCategory } from '../types/index';

/**
 * Service for managing regulatory categories
 */
export const categoryService = {
  /**
   * Get all categories from the database
   */
  getCategories: async (): Promise<RegulationCategory[]> => {
    const { data, error } = await supabase
      .from('regulatory_categories')
      .select('*')
      .order('priority', { ascending: true });
    
    if (error) {
      console.error('Error fetching regulatory categories:', error);
      return [];
    }
    
    return data || [];
  },
  
  /**
   * Get category ID by code
   */
  getCategoryIdByCode: async (code: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from('regulatory_categories')
      .select('id')
      .eq('code', code)
      .single();
    
    if (error || !data) {
      console.error(`Error getting category ID for code ${code}:`, error);
      return null;
    }
    
    return data.id;
  }
};

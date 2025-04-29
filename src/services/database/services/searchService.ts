
import { supabase } from '@/integrations/supabase/client';
import { RegulationProvision } from '../types';

/**
 * Service for searching regulatory provisions
 */
export const searchService = {
  /**
   * Search for provisions based on query text
   */
  searchProvisions: async (query: string): Promise<RegulationProvision[]> => {
    // Use the search index table with the search vector for full-text search
    const { data, error } = await supabase
      .from('regulatory_provisions')
      .select('*')
      .textSearch('search_index(full_text)', query, { 
        config: 'english',
        type: 'websearch'
      });
    
    if (error) {
      console.error('Error searching provisions:', error);
      // Fallback to simple ILIKE search if full-text search fails
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('regulatory_provisions')
        .select('*')
        .or(`content.ilike.%${query}%,title.ilike.%${query}%,rule_number.ilike.%${query}%`)
        .limit(20);
      
      if (fallbackError) {
        console.error('Error in fallback search:', fallbackError);
        return [];
      }
      
      return fallbackData || [];
    }
    
    return data || [];
  }
};

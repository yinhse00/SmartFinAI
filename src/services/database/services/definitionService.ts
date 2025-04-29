
import { supabase } from '@/integrations/supabase/client';
import { RegulationDefinition } from '../types';

/**
 * Service for managing regulatory definitions
 */
export const definitionService = {
  /**
   * Add a definition to the database
   */
  addDefinition: async (definition: RegulationDefinition): Promise<RegulationDefinition | null> => {
    const { data, error } = await supabase
      .from('regulatory_definitions')
      .insert(definition)
      .select()
      .single();
    
    if (error) {
      console.error('Error adding definition:', error);
      return null;
    }
    
    return data;
  },
  
  /**
   * Search for definitions based on term
   */
  searchDefinitions: async (term: string): Promise<RegulationDefinition[]> => {
    const { data, error } = await supabase
      .from('regulatory_definitions')
      .select('*, regulatory_categories(name)')
      .ilike('term', `%${term}%`)
      .limit(10);
    
    if (error) {
      console.error('Error searching definitions:', error);
      return [];
    }
    
    return data || [];
  }
};

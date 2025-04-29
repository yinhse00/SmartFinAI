
import { supabase } from '@/integrations/supabase/client';
import { DocumentCategory } from '@/types/references';

export interface RegulationProvision {
  id?: string;
  rule_number: string;
  title: string;
  content: string;
  category_id?: string;
  chapter?: string;
  section?: string;
  subsection?: string;
  version?: string;
  path_reference?: string;
  parent_id?: string;
  source_document_id?: string;
}

export interface RegulationCategory {
  id?: string;
  code: string;
  name: string;
  description?: string;
  priority?: number;
}

export interface RegulationDefinition {
  id?: string;
  term: string;
  definition: string;
  category_id?: string;
  source_provision_id?: string;
}

export const regulatoryDatabaseService = {
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
  },
  
  /**
   * Add a provision to the database
   */
  addProvision: async (provision: RegulationProvision): Promise<RegulationProvision | null> => {
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
  addProvisions: async (provisions: RegulationProvision[]): Promise<number> => {
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
  },
  
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

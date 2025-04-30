
import { supabase } from '@/integrations/supabase/client';

/**
 * Service for getting database statistics
 */
export const statsService = {
  /**
   * Get database statistics
   */
  getDatabaseStats: async () => {
    try {
      const [categoriesResult, provisionsResult, definitionsResult, faqsResult] = await Promise.all([
        supabase.from('regulatory_categories').select('*', { count: 'exact', head: true }),
        supabase.from('regulatory_provisions').select('*', { count: 'exact', head: true }),
        supabase.from('regulatory_definitions').select('*', { count: 'exact', head: true }),
        supabase.from('regulatory_faqs').select('*', { count: 'exact', head: true })
      ]);

      return {
        categories: categoriesResult.count || 0,
        provisions: provisionsResult.count || 0,
        definitions: definitionsResult.count || 0,
        faqs: faqsResult.count || 0
      };
    } catch (error) {
      console.error('Error fetching database stats:', error);
      return {
        categories: 0,
        provisions: 0,
        definitions: 0,
        faqs: 0
      };
    }
  }
};

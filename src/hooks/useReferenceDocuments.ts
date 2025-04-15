
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ReferenceDocument } from '@/types/references';

export function useReferenceDocuments(category?: string) {
  return useQuery({
    queryKey: ['referenceDocuments', category],
    queryFn: async (): Promise<ReferenceDocument[]> => {
      let query = supabase
        .from('reference_documents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching reference documents:', error);
        throw new Error(`Failed to fetch reference documents: ${error.message}`);
      }
      
      return data || [];
    }
  });
}

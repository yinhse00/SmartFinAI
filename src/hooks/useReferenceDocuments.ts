
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ReferenceDocument, DocumentCategory } from '@/types/references';

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
      
      // Convert the raw data to ReferenceDocument type
      const typedData = data?.map(item => ({
        ...item,
        category: item.category as DocumentCategory
      })) as ReferenceDocument[];
      
      return typedData || [];
    },
    refetchOnWindowFocus: true,          // Refetch when window regains focus
    staleTime: 0,                        // Consider data stale immediately
    refetchInterval: false,              // Don't automatically refetch at intervals
    retry: 1,                           // Retry failed requests once
  });
}

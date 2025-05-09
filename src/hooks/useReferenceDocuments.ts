
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ReferenceDocument, DocumentCategory } from '@/types/references';

export function useReferenceDocuments(category?: string) {
  return useQuery({
    queryKey: ['referenceDocuments', category],
    queryFn: async (): Promise<ReferenceDocument[]> => {
      try {
        console.log('Starting document fetch process for category:', category || 'all');
        
        let query = supabase
          .from('reference_documents')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (category) {
          query = query.eq('category', category);
        }
        
        console.log('Executing Supabase query with parameters:', {
          category: category || 'all',
          method: 'select',
          ordering: 'created_at descending'
        });
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Supabase query error:', error);
          return []; // Return empty array instead of throwing
        }
        
        console.log('Raw data received:', {
          rowCount: data?.length || 0,
          firstRowDetails: data?.[0]
        });
        
        // Convert the raw data to ReferenceDocument type
        const typedData = data?.map(item => ({
          ...item,
          category: item.category as DocumentCategory
        })) as ReferenceDocument[];
        
        console.log(`Fetch completed: ${typedData?.length || 0} documents for category "${category || 'all'}"`);
        
        return typedData || [];
      } catch (err) {
        console.error("Error fetching reference documents:", err);
        return []; // Return empty array on any error
      }
    },
    staleTime: 30000, // Data stays fresh for 30 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: true, // Always enabled but with graceful error handling
  });
}


import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ReferenceDocument, DocumentCategory } from '@/types/references';

export function useReferenceDocuments(category?: string) {
  return useQuery({
    queryKey: ['referenceDocuments', category, Date.now()], // Add timestamp to force new cache entry each time
    queryFn: async (): Promise<ReferenceDocument[]> => {
      console.log('Fetching reference documents for category:', category);
      
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
      
      console.log(`Fetched ${typedData?.length || 0} documents`);
      return typedData || [];
    },
    refetchOnWindowFocus: true,    // Changed to true to ensure data refresh
    staleTime: 0,                  // Data is immediately stale
    gcTime: 0,                     // Don't cache the data at all
    refetchInterval: 2000,         // Force refetch every 2 seconds
    refetchOnMount: 'always',      // Always refetch when component mounts
    refetchOnReconnect: 'always',  // Always refetch when reconnecting
  });
}

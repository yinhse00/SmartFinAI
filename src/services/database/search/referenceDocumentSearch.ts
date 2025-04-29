
import { supabase } from '@/integrations/supabase/client';
import { DocumentCategory, ReferenceDocument } from '@/types/references';

/**
 * Helper function to search reference documents
 */
export async function searchReferenceDocuments(
  query: string, 
  category?: string, 
  prioritizeFAQ: boolean = false
): Promise<{ referenceDocuments: ReferenceDocument[] }> {
  // Search reference documents in Supabase
  let referenceQuery = supabase
    .from('reference_documents')
    .select('*');
    
  if (category && category !== 'all') {
    referenceQuery = referenceQuery.eq('category', category);
  }
  
  // Add search filter for title and description
  const { data: referenceData, error } = await referenceQuery.or(
    `title.ilike.%${query}%,description.ilike.%${query}%`
  );
  
  if (error) {
    console.error("Error searching reference documents:", error);
    return { referenceDocuments: [] };
  }
  
  // Convert the raw data to ReferenceDocument type
  const typedReferenceData = referenceData?.map(item => ({
    ...item,
    category: item.category as DocumentCategory
  })) as ReferenceDocument[] || [];
  
  // Prioritize FAQ documents if requested
  if (prioritizeFAQ) {
    return {
      referenceDocuments: typedReferenceData.sort((a, b) => {
        const aIsFaq = a.title.includes('10.4') || 
                      a.title.toLowerCase().includes('faq') || 
                      a.title.toLowerCase().includes('continuing');
        const bIsFaq = b.title.includes('10.4') || 
                      b.title.toLowerCase().includes('faq') || 
                      b.title.toLowerCase().includes('continuing');
        
        if (aIsFaq && !bIsFaq) return -1;
        if (!aIsFaq && bIsFaq) return 1;
        return 0;
      })
    };
  }
  
  return { referenceDocuments: typedReferenceData };
}

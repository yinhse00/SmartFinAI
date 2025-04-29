
import { useQuery } from '@tanstack/react-query';
import { RegulationProvision } from '@/services/database/types';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

export const useProvisions = (categoryId: string) => {
  const { data: provisions, isLoading } = useQuery({
    queryKey: ['regulatoryProvisions', categoryId],
    queryFn: async (): Promise<RegulationProvision[]> => {
      try {
        if (!categoryId) return [];
        
        const { data, error } = await supabase
          .from('regulatory_provisions')
          .select('*')
          .eq('category_id', categoryId)
          .order('rule_number');
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error loading provisions:', error);
        return [];
      }
    },
    enabled: !!categoryId
  });

  // Group provisions by chapter
  const provisionsByChapter = useMemo(() => {
    if (!provisions) return {};
    
    return provisions.reduce((acc, provision) => {
      const chapter = provision.chapter || 'Uncategorized';
      if (!acc[chapter]) {
        acc[chapter] = [];
      }
      acc[chapter].push(provision);
      return acc;
    }, {} as Record<string, RegulationProvision[]>);
  }, [provisions]);

  return {
    provisions,
    provisionsByChapter,
    isLoading
  };
};

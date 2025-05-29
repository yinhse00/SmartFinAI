
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EcmIssuer, EcmInvestor, EcmDeal, EcmInvestorMatch, EcmMarketData } from '@/types/ecm';

// Hook for managing ECM issuers
export function useEcmIssuers() {
  return useQuery({
    queryKey: ['ecm-issuers'],
    queryFn: async (): Promise<EcmIssuer[]> => {
      const { data, error } = await supabase
        .from('ecm_issuers')
        .select('*')
        .order('company_name');
      
      if (error) {
        console.error('Error fetching ECM issuers:', error);
        throw error;
      }
      
      return (data || []) as EcmIssuer[];
    },
    staleTime: 30000,
  });
}

// Hook for managing ECM investors
export function useEcmInvestors() {
  return useQuery({
    queryKey: ['ecm-investors'],
    queryFn: async (): Promise<EcmInvestor[]> => {
      const { data, error } = await supabase
        .from('ecm_investors')
        .select('*')
        .order('investor_name');
      
      if (error) {
        console.error('Error fetching ECM investors:', error);
        throw error;
      }
      
      return (data || []) as EcmInvestor[];
    },
    staleTime: 30000,
  });
}

// Hook for managing ECM deals
export function useEcmDeals(status?: string) {
  return useQuery({
    queryKey: ['ecm-deals', status],
    queryFn: async (): Promise<EcmDeal[]> => {
      let query = supabase
        .from('ecm_deals')
        .select(`
          *,
          ecm_issuers (
            company_name,
            stock_code,
            sector
          )
        `)
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('deal_status', status);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching ECM deals:', error);
        throw error;
      }
      
      return (data || []) as EcmDeal[];
    },
    staleTime: 30000,
  });
}

// Hook for investor matching
export function useInvestorMatches(dealId: string) {
  return useQuery({
    queryKey: ['investor-matches', dealId],
    queryFn: async (): Promise<EcmInvestorMatch[]> => {
      const { data, error } = await supabase
        .from('ecm_investor_matches')
        .select(`
          *,
          ecm_investors (
            investor_name,
            investor_type,
            aum_range
          )
        `)
        .eq('deal_id', dealId)
        .order('match_score', { ascending: false });
      
      if (error) {
        console.error('Error fetching investor matches:', error);
        throw error;
      }
      
      return (data || []) as EcmInvestorMatch[];
    },
    enabled: !!dealId,
    staleTime: 30000,
  });
}

// Hook for market data
export function useEcmMarketData() {
  return useQuery({
    queryKey: ['ecm-market-data'],
    queryFn: async (): Promise<EcmMarketData[]> => {
      const { data, error } = await supabase
        .from('ecm_market_data')
        .select('*')
        .order('data_date', { ascending: false })
        .limit(30); // Last 30 days
      
      if (error) {
        console.error('Error fetching market data:', error);
        throw error;
      }
      
      return (data || []) as EcmMarketData[];
    },
    staleTime: 60000, // 1 minute
  });
}

// Mutation for creating new deals
export function useCreateDeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dealData: { deal_name: string; deal_type: string; deal_status?: string; currency?: string }) => {
      const { data, error } = await supabase
        .from('ecm_deals')
        .insert([dealData])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating deal:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecm-deals'] });
    },
  });
}

// Mutation for updating deal status
export function useUpdateDealStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ dealId, status }: { dealId: string; status: string }) => {
      const { data, error } = await supabase
        .from('ecm_deals')
        .update({ deal_status: status, updated_at: new Date().toISOString() })
        .eq('id', dealId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating deal status:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecm-deals'] });
    },
  });
}

// Mutation for creating investor matches
export function useCreateInvestorMatch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (matchData: Partial<EcmInvestorMatch>) => {
      const { data, error } = await supabase
        .from('ecm_investor_matches')
        .insert([matchData])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating investor match:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['investor-matches', data.deal_id] });
    },
  });
}

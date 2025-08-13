
import { supabase } from "@/integrations/supabase/client";

export interface QuoteData {
  symbol: string;
  price: number | null;
  pe: number | null;
  pb: number | null;
  currency: string;
  timestamp: number; // epoch ms
}

export const marketDataService = {
  async getQuote(symbol: string): Promise<QuoteData | null> {
    const cleaned = symbol.trim();
    if (!cleaned) return null;

    const { data, error } = await supabase.functions.invoke("market-data", {
      body: { symbol: cleaned },
    });

    if (error) {
      console.error("Edge function error:", error);
      return null;
    }

    if (!data?.success) {
      console.warn("market-data returned failure:", data);
      return null;
    }

    return data.data as QuoteData;
  },
};

export interface QuoteData {
  symbol: string;
  price: number | null;
  pe: number | null;
  pb: number | null;
  currency: string;
  timestamp: number; // epoch ms
}

export const marketDataService = {
  // Placeholder implementation. Replace with real provider (e.g., Finnhub) via a Supabase Edge Function.
  async getQuote(symbol: string): Promise<QuoteData | null> {
    // Simple demo for 0005.HK (HSBC)
    if (symbol.toUpperCase() === "0005.HK") {
      return {
        symbol: "0005.HK",
        price: 61.20,
        pe: 6.8,
        pb: 0.9,
        currency: "HKD",
        timestamp: Date.now(),
      };
    }
    // No data for other symbols until provider is integrated
    return null;
  },
};

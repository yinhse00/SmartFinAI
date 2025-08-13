import React, { useEffect, useMemo, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { marketDataService, QuoteData } from "@/services/market/marketDataService";
import { TrendingUp, LineChart, Info } from "lucide-react";

const MarketDataPage: React.FC = () => {
  const [symbol, setSymbol] = useState("0005.HK");
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [live, setLive] = useState(true);

  // Basic SEO tags for SPA
  useEffect(() => {
    document.title = "HK Market Data | SmartFinAI"; // <60 chars
    const metaDesc = document.querySelector('meta[name="description"]');
    const canonical = document.querySelector('link[rel="canonical"]');

    if (!metaDesc) {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = "Real-time HK market data: price, P/E, P/B for HKEX listings.";
      document.head.appendChild(m);
    } else {
      metaDesc.setAttribute(
        "content",
        "Real-time HK market data: price, P/E, P/B for HKEX listings."
      );
    }

    if (!canonical) {
      const link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      link.setAttribute("href", window.location.href);
      document.head.appendChild(link);
    }
  }, []);

  const handleFetch = async () => {
    const cleaned = symbol.trim();
    if (!cleaned) return;
    setLoading(true);
    try {
      const data = await marketDataService.getQuote(cleaned);
      if (!data) {
        toast({
          title: "No data found",
          description: "Please check the symbol or your data provider connection.",
        });
      }
      setQuote(data);
    } catch (e) {
      toast({ title: "Error", description: "Failed to fetch market data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh when live
  useEffect(() => {
    if (!live) return;
    // Fetch immediately, then every 5s
    handleFetch();
    const id = setInterval(() => {
      handleFetch();
    }, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, symbol]);

  const headerSubtitle = useMemo(
    () => "Lookup HK-listed company price, P/E, and P/B multiples.",
    []
  );

  return (
    <MainLayout>
      <header className="container mx-auto px-4 pt-8">
        <h1 className="text-3xl font-bold">HK Market Data</h1>
        <p className="text-muted-foreground mt-2">{headerSubtitle}</p>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section aria-labelledby="lookup" className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Market Lookup
                </span>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${live ? "bg-green-500" : "bg-gray-300"}`}
                    aria-hidden="true"
                  />
                  Live updates
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={live}
                    onChange={(e) => setLive(e.target.checked)}
                    aria-label="Toggle live updates"
                  />
                </label>
              </CardTitle>
              <CardDescription>
                Enter HKEX ticker, e.g. 0005.HK or 1299.HK
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="e.g. 0005.HK"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  aria-label="HKEX symbol"
                />
                <Button onClick={handleFetch} disabled={loading}>
                  {loading ? "Fetching..." : "Fetch"}
                </Button>
              </div>
              <Separator className="my-6" />
              {quote ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Last Price</CardTitle>
                      <CardDescription>{quote.symbol} · {quote.currency}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-semibold">{quote.price?.toFixed(2) ?? "-"}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Updated: {new Date(quote.timestamp).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">P/E</CardTitle>
                      <CardDescription>Price to Earnings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-semibold">{quote.pe ?? "-"}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">P/B</CardTitle>
                      <CardDescription>Price to Book</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-semibold">{quote.pb ?? "-"}</div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4" />
                  Live data not connected. This is a new category ready for integration.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Multiples Guide
              </CardTitle>
              <CardDescription>Common valuation ratios</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>P/E = Price / EPS (ttm)</li>
                <li>P/B = Price / Book Value per Share</li>
                <li>Use sector peers for context</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>About HKEX Symbols</CardTitle>
              <CardDescription>Format and best practices</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Use numeric code plus suffix .HK (e.g., 0005.HK). Some data providers also accept without suffix.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </MainLayout>
  );
};

export default MarketDataPage;

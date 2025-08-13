
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

type QuoteResponse = {
  c?: number; // current price
  t?: number; // timestamp (sec)
};

type MetricsResponse = {
  metric?: Record<string, number | string | null>;
};

function extractNumber(value: unknown): number | null {
  return typeof value === 'number' && isFinite(value) ? value : null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const isGet = req.method === 'GET';
  let symbol: string | undefined;

  try {
    if (isGet) {
      symbol = url.searchParams.get('symbol') ?? undefined;
    } else {
      const body = await req.json().catch(() => ({}));
      symbol = body?.symbol;
    }
  } catch {
    // Ignore parse errors and fall through to validation
  }

  if (!symbol || typeof symbol !== 'string') {
    return new Response(JSON.stringify({ success: false, error: 'Missing or invalid symbol' }), {
      headers: corsHeaders,
      status: 400,
    });
  }

  const apiKey = Deno.env.get('FINNHUB_API_KEY');
  if (!apiKey) {
    console.error('FINNHUB_API_KEY not configured');
    return new Response(JSON.stringify({ success: false, error: 'Server not configured' }), {
      headers: corsHeaders,
      status: 500,
    });
  }

  try {
    const base = 'https://finnhub.io/api/v1';

    // Fetch quote and metrics concurrently
    const [quoteRes, metricRes] = await Promise.all([
      fetch(`${base}/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`),
      fetch(`${base}/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${apiKey}`),
    ]);

    if (!quoteRes.ok) {
      const text = await quoteRes.text().catch(() => '');
      console.warn('Finnhub quote error', quoteRes.status, text);
    }
    if (!metricRes.ok) {
      const text = await metricRes.text().catch(() => '');
      console.warn('Finnhub metric error', metricRes.status, text);
    }

    const quoteJson = (await quoteRes.json().catch(() => ({}))) as QuoteResponse;
    const metricsJson = (await metricRes.json().catch(() => ({}))) as MetricsResponse;

    const m = metricsJson?.metric ?? {};

    // Heuristics for P/E and P/B
    let pe =
      extractNumber(m['peBasicExclExtraTTM']) ??
      extractNumber(m['peInclExtraTTM']) ??
      extractNumber(m['peTTM']) ??
      extractNumber(m['peAnnual']) ??
      null;

    let pb =
      extractNumber(m['pbAnnual']) ??
      extractNumber(m['pbQuarterly']) ??
      extractNumber(m['pbTTM']) ??
      null;

    const currencyRaw = (m['currency'] as string | undefined) ?? undefined;
    let currency =
      (currencyRaw && typeof currencyRaw === 'string' && currencyRaw.length <= 6 ? currencyRaw : undefined) ??
      (symbol.toUpperCase().endsWith('.HK') ? 'HKD' : 'USD');

    const nowMs = Date.now();
    let tsMs = quoteJson?.t ? quoteJson.t * 1000 : nowMs;

    let price = extractNumber(quoteJson?.c) ?? null;

    // ---- Fallback to Yahoo Finance via RapidAPI when data missing ----
    if ((price === null || pe === null || pb === null) && Deno.env.get('RAPIDAPI_KEY')) {
      const rapidKey = Deno.env.get('RAPIDAPI_KEY')!;
      const region = symbol.toUpperCase().endsWith('.HK') ? 'HK' : 'US';
      const yhUrl = new URL('https://yh-finance.p.rapidapi.com/stock/v2/get-summary');
      yhUrl.searchParams.set('symbol', symbol);
      yhUrl.searchParams.set('region', region);

      try {
        const yhRes = await fetch(yhUrl.toString(), {
          headers: {
            'x-rapidapi-key': rapidKey,
            'x-rapidapi-host': 'yh-finance.p.rapidapi.com',
          },
        });

        if (!yhRes.ok) {
          const body = await yhRes.text().catch(() => '');
          console.warn('Yahoo (RapidAPI) get-summary error', yhRes.status, body);
        } else {
          const yh: any = await yhRes.json().catch(() => ({}));

          const toNum = (v: unknown): number | null =>
            typeof v === 'number' && isFinite(v)
              ? v
              : typeof (v as any)?.raw === 'number' && isFinite((v as any).raw)
              ? (v as any).raw
              : null;

          const yhPrice =
            toNum(yh?.price?.regularMarketPrice) ??
            toNum(yh?.financialData?.currentPrice) ??
            null;

          const yhPE =
            toNum(yh?.defaultKeyStatistics?.trailingPE) ??
            toNum(yh?.summaryDetail?.trailingPE) ??
            null;

          const yhPB =
            toNum(yh?.defaultKeyStatistics?.priceToBook) ??
            toNum(yh?.summaryDetail?.priceToBook) ??
            null;

          const yhCurrency =
            typeof yh?.price?.currency === 'string' && yh?.price?.currency.length <= 6
              ? yh.price.currency
              : null;

          const yhTimeRaw =
            toNum(yh?.price?.regularMarketTime) ?? // sometimes number
            toNum(yh?.price?.regularMarketTime?.raw); // sometimes { raw }
          const yhTimeMs = yhTimeRaw ? yhTimeRaw * 1000 : null;

          // Fill missing fields from Yahoo
          if (price === null && yhPrice !== null) {
            price = yhPrice;
            if (yhTimeMs) tsMs = yhTimeMs;
          }
          if (pe === null && yhPE !== null) pe = yhPE;
          if (pb === null && yhPB !== null) pb = yhPB;
          if ((!currency || currency === 'USD') && yhCurrency) currency = yhCurrency;
        }
      } catch (e) {
        console.warn('Yahoo (RapidAPI) fallback failed:', e);
      }
    }
    // ---- end fallback ----

    // If we still have nothing meaningful, return failure so the client can inform the user
    if (price === null && pe === null && pb === null) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No data available from providers (Finnhub/Yahoo). Check symbol or data access.',
        }),
        { headers: corsHeaders, status: 200 }
      );
    }

    const data = {
      symbol,
      price,
      pe,
      pb,
      currency,
      timestamp: tsMs,
    };

    return new Response(JSON.stringify({ success: true, data }), {
      headers: corsHeaders,
      status: 200,
    });
  } catch (err) {
    console.error('market-data function error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Upstream error' }), {
      headers: corsHeaders,
      status: 502,
    });
  }
});

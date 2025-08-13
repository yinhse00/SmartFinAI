
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
    const pe =
      extractNumber(m['peBasicExclExtraTTM']) ??
      extractNumber(m['peInclExtraTTM']) ??
      extractNumber(m['peTTM']) ??
      extractNumber(m['peAnnual']) ??
      null;

    const pb =
      extractNumber(m['pbAnnual']) ??
      extractNumber(m['pbQuarterly']) ??
      extractNumber(m['pbTTM']) ??
      null;

    const currencyRaw = (m['currency'] as string | undefined) ?? undefined;
    const currency =
      (currencyRaw && typeof currencyRaw === 'string' && currencyRaw.length <= 6 ? currencyRaw : undefined) ??
      (symbol.toUpperCase().endsWith('.HK') ? 'HKD' : 'USD');

    const nowMs = Date.now();
    const tsMs = quoteJson?.t ? quoteJson.t * 1000 : nowMs;

    const data = {
      symbol,
      price: extractNumber(quoteJson?.c) ?? null,
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

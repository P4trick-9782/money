// Supabase Edge Function: price-proxy
// 接受: POST { symbols: ["0050.TW","NVDA","BTC-USD"] }
// 回傳: { "0050.TW": { price, prevClose, changePct, currency }, ... }
// 部署: supabase functions deploy price-proxy

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { symbols } = await req.json();
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return new Response(JSON.stringify({ error: "symbols required" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const results: Record<string, unknown> = {};

    await Promise.all(
      symbols.map(async (symbol: string) => {
        try {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
          const res = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
          });
          const data = await res.json();
          const meta = data?.chart?.result?.[0]?.meta;
          if (meta) {
            const price = meta.regularMarketPrice ?? meta.chartPreviousClose;
            const prev  = meta.previousClose ?? meta.chartPreviousClose ?? price;
            results[symbol] = {
              price,
              prevClose: prev,
              changePct: prev ? ((price - prev) / prev) * 100 : 0,
              currency: meta.currency ?? "USD",
              name: meta.shortName ?? symbol,
            };
          } else {
            results[symbol] = { error: "no data" };
          }
        } catch (e) {
          results[symbol] = { error: String(e) };
        }
      })
    );

    return new Response(JSON.stringify(results), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});

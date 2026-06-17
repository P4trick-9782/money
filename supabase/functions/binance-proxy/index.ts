// Supabase Edge Function: binance-proxy
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hmacSHA256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function binanceRequest(
  apiKey: string, apiSecret: string,
  baseUrl: string, path: string, params: Record<string, string> = {}
) {
  const timestamp = Date.now().toString();
  const queryString = new URLSearchParams({ ...params, timestamp }).toString();
  const signature = await hmacSHA256(apiSecret, queryString);
  const url = `${baseUrl}${path}?${queryString}&signature=${signature}`;

  const res = await fetch(url, {
    headers: { "X-MBX-APIKEY": apiKey },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Binance error ${res.status}: ${err.slice(0, 200)}`);
  }
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { apiKey, apiSecret, type } = await req.json();
    if (!apiKey || !apiSecret) throw new Error("缺少 API Key 或 Secret");

    const result: Record<string, unknown> = {};

    // ── 現貨餘額 ──
    if (type === "spot" || type === "both") {
      try {
        const data = await binanceRequest(
          apiKey, apiSecret,
          "https://api.binance.com", "/api/v3/account"
        );
        const balances = (data.balances as Array<{ asset: string; free: string; locked: string }>)
          .filter(b => parseFloat(b.free) + parseFloat(b.locked) > 0)
          .map(b => ({
            asset: b.asset,
            free: parseFloat(b.free),
            locked: parseFloat(b.locked),
            total: parseFloat(b.free) + parseFloat(b.locked),
          }));

        const symbols = balances
          .filter(b => b.asset !== "USDT" && b.asset !== "BUSD" && b.asset !== "USDC")
          .map(b => `"${b.asset}USDT"`)
          .join(",");

        let prices: Record<string, number> = {};
        if (symbols.length > 0) {
          try {
            const priceRes = await fetch(
              `https://api.binance.com/api/v3/ticker/price?symbols=[${symbols}]`
            );
            if (priceRes.ok) {
              const priceData = await priceRes.json() as Array<{ symbol: string; price: string }>;
              priceData.forEach(p => { prices[p.symbol.replace("USDT", "")] = parseFloat(p.price); });
            }
          } catch { /* 抓不到價格就跳過 */ }
        }

        let totalUsdt = 0;
        const balancesWithUsdt = balances.map(b => {
          let usdt = 0;
          if (b.asset === "USDT" || b.asset === "BUSD" || b.asset === "USDC") {
            usdt = b.total;
          } else if (prices[b.asset]) {
            usdt = b.total * prices[b.asset];
          }
          totalUsdt += usdt;
          return { ...b, usdt: Math.round(usdt * 100) / 100 };
        });

        result.spot = {
          balances: balancesWithUsdt.filter(b => b.usdt > 0.01 || b.total > 0),
          totalUsdt: Math.round(totalUsdt * 100) / 100,
        };
      } catch (e) {
        result.spotError = (e as Error).message;
      }
    }

    // ── 合約（U 本位）── 可選，失敗不影響現貨
    if (type === "futures" || type === "both") {
      try {
        const data = await binanceRequest(
          apiKey, apiSecret,
          "https://fapi.binance.com", "/fapi/v2/account"
        );
        result.futures = {
          walletBalance: parseFloat(data.totalWalletBalance || "0"),
          unrealizedProfit: parseFloat(data.totalUnrealizedProfit || "0"),
          marginBalance: parseFloat(data.totalMarginBalance || "0"),
          availableBalance: parseFloat(data.availableBalance || "0"),
        };
      } catch {
        // 用戶沒有開通合約帳戶，跳過
        result.futures = null;
      }
    }

    // 確保有拿到至少一項資料
    if (!result.spot && !result.futures) {
      throw new Error(String(result.spotError) || "無法取得任何 Binance 資料");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});

import { sbFetch } from "./supabase";

export async function fetchBinanceSnapshot() {
  const res = await sbFetch("/functions/v1/binance-proxy");
  if (!res.ok) throw new Error(`Binance 讀取失敗：${(await res.text()).slice(0, 80)}`);
  return res.json();
}

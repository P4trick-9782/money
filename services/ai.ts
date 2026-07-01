import { sbFetch } from "./supabase";

export async function analyzeFinance(payload: unknown) {
  const res = await sbFetch("/functions/v1/ai-analysis", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`AI 分析失敗：${(await res.text()).slice(0, 80)}`);
  return res.json();
}

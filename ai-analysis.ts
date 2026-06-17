// Supabase Edge Function: ai-analysis
// 接受: POST { prompt: string }
// 回傳: { result: string }
// 部署: supabase functions deploy ai-analysis
//
// 需要環境變數: OPENAI_API_KEY (在 Supabase Dashboard > Edge Functions > Secrets 設定)

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: "prompt required" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      // 若未設定 OpenAI Key，回傳預設分析（rule-based fallback）
      return new Response(JSON.stringify({ result: "（AI 分析尚未設定 OpenAI API Key）\n\n" + ruleBasedAnalysis(prompt) }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "你是一位台灣的個人財務顧問，請用繁體中文回答，語氣友善簡潔。" },
          { role: "user", content: prompt },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    const result = data.choices?.[0]?.message?.content || "無法取得分析結果";
    return new Response(JSON.stringify({ result }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});

// Rule-based fallback (no API key needed)
function ruleBasedAnalysis(prompt: string): string {
  const lines: string[] = [];
  // 從 prompt 提取數字
  const expMatch = prompt.match(/總支出NT\$([0-9,]+)/);
  const incMatch = prompt.match(/總收入NT\$([0-9,]+)/);
  if (expMatch && incMatch) {
    const exp = parseFloat(expMatch[1].replace(/,/g,""));
    const inc = parseFloat(incMatch[1].replace(/,/g,""));
    const ratio = inc > 0 ? exp/inc : 0;
    if (ratio > 0.8) lines.push("⚠️ 近3個月支出佔收入超過80%，建議檢視可削減的非必要花費。");
    else if (ratio > 0.6) lines.push("支出約佔收入的" + Math.round(ratio*100) + "%，整體尚在合理範圍。");
    else lines.push("✅ 支出控制良好，儲蓄率超過40%，請繼續保持！");
  }
  lines.push("建議每月定期記帳並與上月比較，發現消費趨勢。");
  lines.push("可設定各分類預算上限，超支時即時提醒。");
  return lines.join("\n");
}

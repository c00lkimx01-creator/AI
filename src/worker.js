// LeafAI API：Cloudflare Workers AI の公開モデルを呼び出す（自作モデルは使わない）
// 使えるモデルの例:
//   "@cf/meta/llama-3.1-8b-instruct"  … 汎用・日本語もそこそこ
//   "@cf/qwen/qwen1.5-14b-chat-awq"   … 日本語・中国語に比較的強い
const MODEL = "@cf/meta/llama-3.1-8b-instruct";
const SYSTEM_PROMPT = "あなたはLeafAIという親切なAIアシスタントです。日本語で、分かりやすく簡潔に答えてください。";

const MAX_PROMPT = 2000;   // 入力の最大文字数
const MAX_TOKENS = 2048;   // 応答の最大トークン数

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    const { pathname } = new URL(request.url);

    try {
      if (request.method === "GET" && pathname === "/api/v1/health") {
        return json({ ok: true, provider: "workers-ai", model: MODEL });
      }

      if (request.method === "POST" && pathname === "/api/v1/generate") {
        let body;
        try {
          body = await request.json();
        } catch {
          return json({ error: "JSONが不正です" }, 400);
        }

        const prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, MAX_PROMPT) : "";
        if (!prompt) return json({ error: "メッセージを入力してください" }, 400);

        const length = clamp(parseInt(body.length ?? 512, 10) || 512, 1, MAX_TOKENS);
        const temperature = clamp(Number(body.temperature ?? 0.7) || 0.7, 0, 2);

        const result = await env.AI.run(MODEL, {
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          max_tokens: length,
          temperature,
        });

        const text = String(result?.response ?? "").trim();
        return json({ prompt, text });
      }

      return json({ error: "Not Found" }, 404);
    } catch (err) {
      // 例外時もCORSヘッダー付きで返す（ブラウザ側で「Failed to fetch」にならないように）
      return json({ error: "AI呼び出しに失敗: " + (err?.message ?? String(err)) }, 500);
    }
  },
};

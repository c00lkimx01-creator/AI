import model from "./model.json";

const { order, table } = model;
const MAX_PROMPT = 200;
const MAX_LENGTH = 500;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
  });
}

// 出現回数を温度つきで重み付けして次の文字を選ぶ
function pick(row, temperature) {
  const entries = Object.entries(row);
  const weights = entries.map(([, c]) => Math.pow(c, 1 / temperature));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < entries.length; i++) {
    r -= weights[i];
    if (r <= 0) return entries[i][0];
  }
  return entries[entries.length - 1][0];
}

// 長い文脈から順に試し、見つからなければ短くする（バックオフ）
function nextChar(context, temperature) {
  for (let n = Math.min(order, context.length); n >= 1; n--) {
    const row = table[context.slice(-n)];
    if (row) return pick(row, temperature);
  }
  return null;
}

function generate(prompt, length, temperature) {
  let out = "";
  let context = prompt || "\n";
  for (let i = 0; i < length; i++) {
    const ch = nextChar(context, temperature);
    if (ch === null) break;
    out += ch;
    context += ch;
  }
  return out;
}

export default {
  async fetch(request) {
    const { pathname } = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    if (request.method === "GET" && pathname === "/api/v1/health") {
      return json({ ok: true, order, contexts: Object.keys(table).length });
    }

    if (request.method === "POST" && pathname === "/api/v1/generate") {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "JSONが不正です" }, 400);
      }

      const prompt =
        typeof body.prompt === "string" ? body.prompt.slice(0, MAX_PROMPT) : "";
      const length = Math.min(
        Math.max(parseInt(body.length ?? 200, 10) || 200, 1),
        MAX_LENGTH
      );
      const temperature = Math.min(
        Math.max(Number(body.temperature ?? 0.8) || 0.8, 0.1),
        2
      );

      const text = generate(prompt, length, temperature);
      return json({ prompt, text });
    }

    return json({ error: "Not Found" }, 404);
  },
};

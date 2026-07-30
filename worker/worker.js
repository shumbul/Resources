/*
 * Resources AI proxy - Cloudflare Worker
 *
 * Purpose: let the static site call an AI model with ZERO setup for visitors,
 * while keeping your Groq API key secret and free. The key lives as a Worker
 * secret (never in the site, never in git). The Worker forwards chat requests
 * to Groq and streams the response back.
 *
 * Free stack: Cloudflare Workers free tier + Groq free tier.
 *
 * Deploy: see worker/README.md.
 */

// Only these origins may call the Worker. Add/replace with your GitHub Pages URL.
const ALLOWED_ORIGINS = [
  "https://shumbul.github.io",
  "http://localhost:8777",
  "http://127.0.0.1:8777",
];

// Guardrails so a shared key can't be abused into a big bill / quota burn.
const ALLOWED_MODELS = new Set([
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
]);
const DEFAULT_MODEL = "llama-3.1-8b-instant";
const MAX_TOKENS_CAP = 800;
const MAX_MESSAGES = 12;
const MAX_BODY_BYTES = 24 * 1024; // 24 KB request cap

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);

    // Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, cors);
    }

    // Block unknown origins (basic abuse protection for a shared key)
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return json({ error: "Origin not allowed" }, 403, cors);
    }

    if (!env.GROQ_API_KEY) {
      return json({ error: "Server not configured: missing GROQ_API_KEY secret" }, 500, cors);
    }

    // Size cap
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return json({ error: "Request too large" }, 413, cors);
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return json({ error: "Invalid JSON" }, 400, cors);
    }

    // Validate and clamp
    let messages = Array.isArray(payload.messages) ? payload.messages : null;
    if (!messages || messages.length === 0) {
      return json({ error: "messages required" }, 400, cors);
    }
    if (messages.length > MAX_MESSAGES) {
      messages = messages.slice(-MAX_MESSAGES);
    }

    const model = ALLOWED_MODELS.has(payload.model) ? payload.model : DEFAULT_MODEL;
    const stream = payload.stream !== false; // default to streaming
    const temperature = clampNum(payload.temperature, 0, 1.5, 0.7);
    const max_tokens = clampNum(payload.max_tokens, 1, MAX_TOKENS_CAP, 700);

    const groqBody = JSON.stringify({ model, messages, temperature, max_tokens, stream });

    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.GROQ_API_KEY}`,
      },
      body: groqBody,
    });

    // Stream (or forward) the provider response straight back to the browser.
    const headers = new Headers(cors);
    headers.set("Content-Type", groqRes.headers.get("Content-Type") || "application/json");
    return new Response(groqRes.body, { status: groqRes.status, headers });
  },
};

function clampNum(v, min, max, dflt) {
  const n = Number(v);
  if (!isFinite(n)) return dflt;
  return Math.max(min, Math.min(max, n));
}

function json(obj, status, cors) {
  const headers = new Headers(cors);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(obj), { status, headers });
}

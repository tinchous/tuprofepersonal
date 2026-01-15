/**
 * Vercel Serverless Function: /api/generate
 * - Oculta la GEMINI_API_KEY (no va al cliente)
 * - Rate limit diario por IP y por herramienta (tizaia/tep/gte)
 *
 * Requisitos (recomendado):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *   GEMINI_API_KEY
 *
 * Opcional:
 *   GEMINI_MODEL (default: gemini-2.0-flash)
 */
const crypto = require("crypto");

const LIMITS = {
  tizaia: 5,
  tep: 1,
  gte: 1,
};

function getMontevideoDateKey() {
  // YYYYMMDD en America/Montevideo (evita corte raro por UTC)
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Montevideo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find(p => p.type === "year").value;
  const m = parts.find(p => p.type === "month").value;
  const d = parts.find(p => p.type === "day").value;
  return `${y}${m}${d}`;
}

function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length) return xff.split(",")[0].trim();
  if (Array.isArray(xff) && xff.length) return xff[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function sha256(s) {
  return crypto.createHash("sha256").update(String(s)).digest("hex");
}

async function upstashIncrWithTTL(key, ttlSeconds) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  // INCR
  const incrRes = await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!incrRes.ok) throw new Error(`Upstash INCR failed: ${incrRes.status}`);
  const incrJson = await incrRes.json();
  const value = incrJson?.result;

  // Set TTL solo cuando recién se crea (value === 1)
  if (value === 1) {
    const exRes = await fetch(`${url}/expire/${encodeURIComponent(key)}/${ttlSeconds}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // si falla el EXPIRE, igual seguimos (no es crítico)
    if (!exRes.ok) console.warn("Upstash EXPIRE failed", exRes.status);
  }

  return value;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Method Not Allowed" }));
      return;
    }

    const { tool, requestBody } = req.body || {};
    const toolKey = String(tool || "tizaia").toLowerCase();
    const limit = LIMITS[toolKey] ?? LIMITS.tizaia;

    if (!requestBody || typeof requestBody !== "object") {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Missing requestBody" }));
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Server misconfigured: GEMINI_API_KEY missing" }));
      return;
    }

    // ---- Rate limit (recomendado: Upstash)
    const ip = getClientIp(req);
    const day = getMontevideoDateKey();
    const ipHash = sha256(ip).slice(0, 16); // cortito, suficiente

    const rlKey = `rl:${toolKey}:${day}:${ipHash}`;
    const count = await upstashIncrWithTTL(rlKey, 60 * 60 * 26); // 26h por si cambia la hora, no importa

    if (typeof count === "number" && count > limit) {
      res.statusCode = 429;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: "rate_limited",
          message: `Límite diario alcanzado para ${toolKey}. Probá mañana :)`,
          limit,
        })
      );
      return;
    }

    // ---- Llamada a Gemini
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const text = await geminiRes.text();
    if (!geminiRes.ok) {
      // Pasamos el error tal cual (pero en JSON)
      res.statusCode = geminiRes.status;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "gemini_error", status: geminiRes.status, detail: text }));
      return;
    }

    // Devolvemos el JSON original de Gemini (así el frontend no cambia)
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(text);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "server_error", message: err?.message || String(err) }));
  }
};

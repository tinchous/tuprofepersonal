export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Server misconfigured: GEMINI_API_KEY missing" });

    const { tool, requestBody } = req.body || {};
    if (!requestBody || !requestBody.contents) return res.status(400).json({ error: "Bad Request: requestBody.contents missing" });

    const model = process.env.GEMINI_MODEL || "gemini-1.5-flash-latest";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    async function callGemini() {
      return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
    }

    let r = await callGemini();

    // 1 retry si 429
    if (r.status === 429) {
      await new Promise(r => setTimeout(r, 1500));
      r = await callGemini();
    }

    const text = await r.text();

    if (!r.ok) {
      // devolvemos el error real tal cual para diagnóstico
      return res.status(r.status).setHeader("Content-Type", "application/json").send(text);
    }

    return res.status(200).setHeader("Content-Type", "application/json").send(text);
  } catch (e) {
    return res.status(500).json({ error: "Internal Error", details: String(e?.message || e) });
  }
}

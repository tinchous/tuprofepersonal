module.exports = async (req, res) => {
  // CORS preflight (por si algún día llamás directo desde otro origen)
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzKl4CuqrTIKUe79R7DFACGzyXgimLUTRC24FnYyJM7i53QSEUbkqGZPtIA5iPcQH8-/exec";

  try {
    // En Vercel Functions, req.body ya suele venir parseado
    const body = req.body || {};

    const r = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      redirect: "follow",
    });

    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { ok: false, raw: text }; }

    // permitir consumo (no molesta aunque sea mismo origen)
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
};

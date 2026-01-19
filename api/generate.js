export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY no configurada en Vercel");
    }

    // El frontend envía { tool, requestBody }
    const { tool, requestBody } = req.body || {};
    if (!requestBody || !requestBody.contents) {
      return res.status(400).json({ error: "requestBody inválido" });
    }

    const model = process.env.GEMINI_MODEL || "gemini-1.5-flash-latest";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const t = await response.text();
      throw new Error(`Gemini API error: ${t}`);
    }

    const data = await response.json();

    return res.status(200).json({
      success: true,
      tool,
      data
    });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

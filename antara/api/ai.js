// Vercel serverless function: /api/ai
// Keeps your NVIDIA API key secret on the server.
// Set the environment variable NVIDIA_API_KEY in Vercel project settings.

export default async function handler(req, res) {
  // CORS (allows the app to call this from anywhere, incl. installed PWA)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "NVIDIA_API_KEY not set in Vercel env vars" });

  try {
    const { prompt, max_tokens } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "prompt required" });

    const upstream = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-ai/deepseek-v4-pro",
        messages: [{ role: "user", content: prompt }],
        max_tokens: max_tokens || 1024,
        temperature: 1,
        top_p: 0.95,
        chat_template_kwargs: { thinking: false },
        stream: false,
      }),
    });

    const data = await upstream.json();
    const text =
      data?.choices?.[0]?.message?.content ||
      data?.error?.message ||
      "No response from model.";
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}

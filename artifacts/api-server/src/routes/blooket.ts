import { Router } from "express";

const router = Router();

router.post("/blooket/join", async (req, res) => {
  const { id, name } = req.body as { id: string; name: string };

  if (!id || !name) {
    res.status(400).json({ success: false, msg: "Missing id or name" });
    return;
  }

  try {
    const response = await fetch("https://blooketbot.schoolcheats.net/join", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: "https://blooketbot.schoolcheats.net/",
        Origin: "https://blooketbot.schoolcheats.net",
      },
      body: JSON.stringify({ id, name }),
    });

    const text = await response.text();

    if (!response.ok) {
      req.log.warn({ status: response.status, body: text }, "Join proxy upstream error");
      res.status(response.status).json({ success: false, msg: text || "Upstream error" });
      return;
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      res.status(502).json({ success: false, msg: "Invalid response from upstream" });
      return;
    }

    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Blooket join proxy error");
    res.status(500).json({ success: false, msg: "Proxy error" });
  }
});

export default router;

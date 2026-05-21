import { Router, Request, Response } from "express";

const router = Router();

const IA_SERVICE_URL = process.env.IA_SERVICE_URL || "http://ia:8000";

// GET /api/recommendations?q=stage python paris&limit=10
router.get("/", async (req: Request, res: Response) => {
  const query = req.query.q as string;
  const limit = parseInt(req.query.limit as string) || 10;

  if (!query || !query.trim()) {
    res.status(400).json({ error: "Le paramètre 'q' est requis" });
    return;
  }

  try {
    const response = await fetch(`${IA_SERVICE_URL}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query.trim(), limit }),
    });

    if (!response.ok) {
      const err = await response.text();
      res.status(502).json({ error: `Microservice IA indisponible: ${err}` });
      return;
    }

    const results = await response.json();
    res.json(results);
  } catch (err) {
    console.error("[Recommendations] Erreur appel IA:", err);
    res.status(503).json({ error: "Microservice IA inaccessible" });
  }
});

export default router;

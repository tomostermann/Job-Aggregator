import { Router, Request, Response } from "express";
import pool from "../config/db";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { fetchAllOffers } = require("../data/fetcher");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { normalizeOffer } = require("../data/normalizer");

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    console.log("[Ingest] Démarrage de l'ingestion...");

    const rawOffers = await fetchAllOffers();
    console.log(`[Ingest] ${rawOffers.length} offres récupérées`);

    let inserted = 0;
    let skipped = 0;

    for (const raw of rawOffers) {
      const offer = normalizeOffer(raw);

      // publishDate est en microsecondes → convertir en millisecondes pour JS Date
      const publishedAt = offer.published_at
        ? new Date(Math.floor(Number(offer.published_at) / 1000))
        : null;

      const result = await pool.query(
        `INSERT INTO offers (source_id, title, company, location, contract_type, description, salary, source, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (source_id) DO NOTHING`,
        [
          offer.source_id,
          offer.title,
          offer.company,
          offer.location,
          offer.contract_type,
          offer.description,
          offer.salary,
          "welovedevs",
          publishedAt,
        ]
      );

      if (result.rowCount && result.rowCount > 0) {
        inserted++;
      } else {
        skipped++;
      }
    }

    console.log(`[Ingest] Terminé — ${inserted} insérées, ${skipped} ignorées (doublons)`);

    // Lance les calculs IA en arrière-plan (sans bloquer la réponse)
    const IA_URL = process.env.IA_URL ?? "http://ia:8000";
    (async () => {
      try {
        // 1. Calcule les embeddings pour les nouvelles offres
        await fetch(`${IA_URL}/compute-embeddings`, { method: "POST" });
        console.log("[Ingest] Embeddings calculés ✓");
        // 2. Stocke les ai_scores dans la colonne offers.ai_score
        await fetch(`${IA_URL}/store-scores`, { method: "POST" });
        console.log("[Ingest] Scores IA stockés ✓");
      } catch (iaErr) {
        console.warn("[Ingest] Avertissement : microservice IA inaccessible :", iaErr);
      }
    })();

    res.json({
      success: true,
      total: rawOffers.length,
      inserted,
      skipped,
    });
  } catch (err) {
    console.error("[Ingest] Erreur :", err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;

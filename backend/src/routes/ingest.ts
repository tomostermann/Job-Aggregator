import { Router, Request, Response } from "express";
import pool from "../config/db";


const { fetchAllOffers } = require("../data/fetcher");

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

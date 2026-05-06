const https = require("https");

const API_BASE = "https://epi-api.welovedevs.com";
const RATE_LIMIT_MS = 1000; // 1 request/sec
const PAGE_SIZE = 10;

/**
 * Attend X millisecondes (rate limit)
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Gère les erreurs HTTP (429, 500, timeout)
 */
function apiGet(path) {
  const apiKey = process.env.WELOVEDEVS_API_KEY;
  if (!apiKey) throw new Error("WELOVEDEVS_API_KEY manquante dans .env");

  return new Promise((resolve, reject) => {
    const url = `${API_BASE}${path}`;
    console.log(`[Fetcher] GET ${url}`);

    const req = https.get(url, { headers: { "X-API-Key": apiKey } }, (res) => {
      // Gestion des erreurs HTTP
      if (res.statusCode === 429) {
        return reject(
          new Error("Rate limit atteint (429) — attendre avant de réessayer"),
        );
      }
      if (res.statusCode === 401 || res.statusCode === 403) {
        return reject(new Error(`Clé API invalide (${res.statusCode})`));
      }
      if (res.statusCode >= 500) {
        return reject(
          new Error(`Erreur serveur WeLoveDevs (${res.statusCode})`),
        );
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Réponse inattendue : ${res.statusCode}`));
      }

      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error("Réponse JSON invalide"));
        }
      });
    });

    // Timeout 10 secondes
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Timeout — pas de réponse en 10s"));
    });

    req.on("error", (err) => {
      console.error(`[Fetcher] Erreur réseau :`, err.message);
      reject(err);
    });
  });
}

/**
 * Récupère toutes les offres avec pagination + rate limit
 * @returns {Promise<Array>} Liste complète des offres brutes
 */
async function fetchAllOffers() {
  const allOffers = [];
  let page = 0;
  let totalCount = null;

  console.log("[Fetcher] Démarrage de la collecte...");

  do {
    try {
      const data = await apiGet(`/v1?page=${page}&size=${PAGE_SIZE}`);

      if (totalCount === null) {
        totalCount = data.totalCount;
        console.log(`[Fetcher] Total disponible : ${totalCount} offres`);
      }

      const offers = data.values || [];
      allOffers.push(...offers);
      console.log(
        `[Fetcher] Page ${page} — ${offers.length} offres (${allOffers.length}/${totalCount})`,
      );

      // Stopper si la page est vide (totalCount peut être inexact)
      if (offers.length === 0) {
        console.log("[Fetcher] Page vide — arrêt de la pagination");
        break;
      }

      page++;

      // Rate limit : attendre 1 seconde entre chaque requête
      if (allOffers.length < totalCount) {
        await sleep(RATE_LIMIT_MS);
      }
    } catch (err) {
      console.error(`[Fetcher] Erreur page ${page} :`, err.message);
      break;
    }
  } while (allOffers.length < totalCount);

  console.log(
    `[Fetcher] Collecte terminée : ${allOffers.length} offres récupérées`,
  );
  return allOffers;
}

module.exports = { fetchAllOffers };

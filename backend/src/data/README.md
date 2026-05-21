# Data Pipeline — WeLoveDevs

Ce dossier contient le pipeline de collecte et normalisation des offres d'emploi depuis l'API WeLoveDevs.

## Fichiers

### `fetcher.js`
Récupère toutes les offres depuis l'API WeLoveDevs.

- Authentification via `X-API-Key` (clé dans le `.env`)
- Pagination automatique (10 offres par page, toutes les pages)
- Rate limit respecté : 1 requête/seconde max
- Gestion des erreurs HTTP : 429 (rate limit), 401/403 (clé invalide), 500+ (erreur serveur), timeout 10s

```js
const { fetchAllOffers } = require('@/data/fetcher');
const offers = await fetchAllOffers(); // retourne toutes les offres brutes
```

### `normalizer.js`
Transforme une offre brute WeLoveDevs en objet propre et standardisé.

- Supprime les balises HTML
- Normalise les espaces
- Extrait les champs : `source_id`, `title`, `description`, `company`, `location`, `published_at`, `contract_type`, `salary`

```js
const { normalizeOffer } = require('@/data/normalizer');
const clean = normalizeOffer(rawOffer);
```

## Flow complet

```
API WeLoveDevs
     │
     ▼
fetcher.js        ← récupère toutes les offres (pagination + rate limit)
     │
     ▼
normalizer.js     ← nettoie et standardise chaque offre
     │
     ▼
Base de données   ← insertion avec déduplication via source_id (TODO)
```

## Variables d'environnement requises

```env
WELOVEDEVS_API_KEY=ta_clé_ici
```

## Tests

```bash
cd backend

# Tests unitaires du normalizer
npm test

# Test réel avec appel API
node tests/test.js
```

# ADR-Data : Stratégie d'intégration des données WeLoveDevs

## Statut

Accepté

---

## Contexte

Le projet Job Aggregator a besoin d'une source d'offres d'emploi tech fiable et volumineuse.
L'objectif est d'afficher des offres réelles aux utilisateurs, sans les créer manuellement.

### Contraintes identifiées

| Contrainte | Raison |
|---|---|
| Source de données réelle | Les offres doivent exister, pas de données fictives |
| Rate limit à respecter | Éviter le bannissement de l'API source |
| Stockage structuré | Requêtes rapides, filtres, contraintes d'intégrité |
| Pipeline automatisable | Pas d'import manuel à chaque mise à jour |
| Stack Python/Node.js | Cohérence avec les microservices existants |

---

## Décision

Nous utilisons l'**API WeLoveDevs** comme source unique d'offres d'emploi, avec un pipeline
d'ingestion Node.js (Express) qui collecte, normalise et stocke les données dans PostgreSQL.

### Stratégie d'intégration WeLoveDevs

WeLoveDevs expose une API REST publique listant des offres d'emploi tech françaises.
Nous l'interrogeons via `GET /jobs` avec pagination pour récupérer l'ensemble du catalogue.

**Paramètres utilisés** :
- `page` — pagination des résultats
- `limit` — nombre d'offres par page (max autorisé)
- Headers d'authentification avec la clé API (`WELOVEDEVS_API_KEY` dans `.env`)

**Volume** : ~1800+ offres disponibles au moment de l'intégration.

### Flow d'ingestion complet

```
API WeLoveDevs
      │
      │  GET /jobs?page=N&limit=50
      ▼
  Fetcher (Node.js)
      │  Parcourt toutes les pages jusqu'à épuisement
      │
      ▼
  Normalizer
      │  Transforme chaque offre brute en format interne standardisé
      │  (titre, entreprise, localisation, type de contrat, salaire, description)
      │
      ▼
  PostgreSQL
      │  INSERT INTO offers ... ON CONFLICT DO NOTHING
      │  (évite les doublons si l'ingestion est relancée)
      ▼
  Base de données prête pour les requêtes utilisateurs
```

### Gestion de la rate limit

L'API WeLoveDevs impose une limite de **1 requête par seconde par étudiant**.

Pour respecter cette contrainte, le pipeline insère un délai de 1 seconde entre chaque appel
paginé :

```typescript
// Délai entre chaque page pour respecter le rate limit
await new Promise((resolve) => setTimeout(resolve, 1000));
```

Sans ce délai, l'API retourne des erreurs `429 Too Many Requests` après quelques pages,
ce qui interrompt l'ingestion et peut entraîner un bannissement temporaire de la clé API.

**Impact sur le temps d'ingestion** : avec ~1800 offres et 50 offres par page, cela représente
~36 appels, soit ~36 secondes pour une ingestion complète. Ce délai est acceptable car
l'ingestion est lancée manuellement une seule fois via `POST /api/admin/ingest`.

### Normalisation des données

Les offres brutes de l'API WeLoveDevs ont un format qui ne correspond pas directement
à notre schéma interne. Le normalizer transforme chaque offre en appliquant ces règles :

| Champ WeLoveDevs | Champ interne | Transformation |
|---|---|---|
| `title` | `title` | Nettoyage des espaces |
| `company.name` | `company` | Extraction du nom uniquement |
| `profile.city` | `location` | Ville extraite du profil |
| `contract.type` | `contract_type` | Standardisation (CDI, CDD, Stage...) |
| `salary.min/max` | `salary` | Formatage en chaîne lisible ou null |
| `description` | `description` | Texte brut, HTML strippé si nécessaire |
| — | `source` | Valeur fixe `"welovedevs"` |
| — | `external_id` | ID unique de l'offre chez WeLoveDevs |

La colonne `external_id` + contrainte `UNIQUE` en base empêche les doublons lors des
réingestions successives (comportement `ON CONFLICT DO NOTHING`).

### Déclenchement de l'ingestion

L'ingestion est déclenchée manuellement via un endpoint admin protégé :

```
POST /api/admin/ingest
Authorization: Bearer <JWT admin>
```

Seul un utilisateur avec le rôle `admin` peut déclencher l'ingestion.
L'endpoint retourne le nombre d'offres insérées et le temps écoulé.

---

## Source additionnelle

Aucune source additionnelle n'a été intégrée. WeLoveDevs couvre suffisamment le marché
tech français pour les besoins du projet (~1800 offres). L'ajout d'une seconde source
(ex : Welcome to the Jungle) aurait nécessité un second normalizer et une gestion des
conflits entre sources — complexité non justifiée dans le cadre du projet.

---

## Alternative rejetée — Scraping web

**Description** : au lieu d'utiliser une API officielle, récupérer les offres en parsant
directement les pages HTML de sites comme Indeed, LinkedIn Jobs ou WTTJ.

**Ce qu'on a évalué** :
- Pas de clé API requise
- Accès à plus de sources simultanément
- Volume potentiel beaucoup plus grand

**Pourquoi on a rejeté** :

- **Légalité incertaine** : le scraping viole les CGU de la plupart des plateformes.
  Dans le cadre d'un projet Epitech évalué, utiliser des données obtenues illégalement
  est un risque inacceptable.

- **Fragilité** : un changement de DOM casse le scraper. L'API WeLoveDevs est stable
  et versionnée.

- **Maintenance** : un scraper multi-sources demande un parser par site, chacun à
  maintenir séparément. L'API WeLoveDevs fournit un format uniforme.

- **Rate limiting non contrôlable** : un scraper agressif peut entraîner un ban d'IP
  permanent, sans recours. Avec l'API officielle, le rate limit est documenté et
  respecté programmatiquement.

**Conclusion** : l'API WeLoveDevs offre un cadre légal, stable, et suffisant pour
le volume cible du projet.

---

## Limitations connues

- **Données statiques** : l'ingestion est manuelle. Les nouvelles offres publiées sur
  WeLoveDevs ne sont pas récupérées automatiquement — il faut relancer `POST /api/admin/ingest`.
- **Pas de suppression des offres expirées** : si une offre est retirée de WeLoveDevs,
  elle reste en base. Un mécanisme de synchronisation (diff entre API et base) n'a pas
  été implémenté.
- **Source unique** : si l'API WeLoveDevs est indisponible, aucune nouvelle offre ne
  peut être ingérée.
- **Salaires souvent null** : beaucoup d'entreprises ne renseignent pas les salaires
  sur WeLoveDevs, ce qui impacte la qualité des données affichées.

---

## Preuve dans le code

- `backend/src/routes/admin.ts` — endpoint `POST /api/admin/ingest`
- `backend/src/services/ingestion.ts` — pipeline fetch → normalize → insert
- `backend/src/services/normalizer.ts` — transformation des offres brutes
- `backend/src/config/schema.sql` — table `offers` avec contrainte `UNIQUE(external_id)`
- `backend/tests/normalizer.test.ts` — tests unitaires du normalizer
- `docker-compose.yml` — variables `WELOVEDEVS_API_KEY` passées au backend

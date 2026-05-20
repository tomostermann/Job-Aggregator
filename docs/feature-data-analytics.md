# Feature : Données & Analytique — Job Aggregator

## Statut

Implémentée (partielle)

## Date

20 mai 2026

---

## Contexte et problème utilisateur

Quand un utilisateur visite la plateforme Job Aggregator, il se retrouve face à **1800+ offres d'emploi**
sans aucun indicateur de pertinence. Il ne sait pas lesquelles regarder en premier, ni si les résultats
de sa recherche sont vraiment adaptés à ce qu'il cherche.

**Question centrale** : comment aider l'utilisateur à évaluer la qualité d'une offre par rapport à sa
recherche, sans lui demander de remplir un profil ?

---

## Hypothèse de départ

> Si on affiche un **score de pertinence** calculé par rapport à la requête de l'utilisateur,
> il sera capable de trier et prioriser les offres plus rapidement.

Ce score devait idéalement prendre en compte le profil utilisateur (compétences, niveau d'expérience,
localisation préférée). Mais cette fonctionnalité a été abandonnée faute de temps — voir section
[Abandonné en cours de route](#abandonné-en-cours-de-route).

---

## Fonctionnalités implémentées

### 1. Score de pertinence IA (mode "Pertinence IA")

**Où** : page `/offers` → filtre "Pertinence IA"

**Comment ça fonctionne** :

Quand l'utilisateur choisit le tri par "Pertinence IA" et saisit une requête :
1. Le frontend appelle `/api/recommendations?q=<requête>&limit=50`
2. Le backend proxie vers le microservice FastAPI `POST http://ia:8000/score`
3. Le microservice encode la requête et chaque offre en vecteur numérique (embeddings)
4. Il calcule la **similarité cosinus** entre la requête et chaque offre
5. Il applique `sqrt(similarité) × 100` pour obtenir un score lisible entre 0 et 100
6. Il applique un **boost de localisation** (+30%) si un mot de la requête correspond à la ville de l'offre
7. Le frontend affiche les offres triées par score décroissant, avec le score visible sur chaque carte

**Exemple concret** — Requête : `"stage python paris"` :

| Offre | Ville | Score brut | Score final | Affiché |
|---|---|---|---|---|
| Software Engineer Python / FastAPI | Paris | 61 | 79 (boost ×1.3) | **79/100** ✅ |
| Développeur Python expérimenté | Lille | 69 | 69 | **69/100** |
| Stage full stack developer | Marseille | 60 | 60 | **60/100** |

Sans le boost de localisation, l'offre à Lille (score sémantique plus élevé) apparaissait en premier —
ce qui était contre-intuitif pour une requête contenant "paris".

**Fichiers concernés** :
- `ia/main.py` — microservice FastAPI (endpoint `/score`)
- `backend/src/routes/recommendations.ts` — route proxy
- `frontend/app/offers/page.tsx` — basculement vers IA si `sort === "ia"` ET requête non vide
- `frontend/lib/score.ts` — retourne `offer.ai_score` directement si disponible
- `frontend/components/OfferCard.tsx` — affiche le score uniquement si `offer.ai_score !== undefined`

---

### 2. Recommandations personnalisées sur le dashboard

**Où** : page `/dashboard` → section "Offres recommandées"

**Comment ça fonctionne** :

À l'ouverture du dashboard, 4 offres sont recommandées via le microservice IA avec une requête
générique : `"développeur web fullstack stage CDI"`. Ces offres sont affichées sans score visible,
car le score d'une requête générique ne représente pas une pertinence réelle pour l'utilisateur
spécifique.

```typescript
// dashboard/page.tsx
const DEFAULT_QUERY = "développeur web fullstack stage CDI";

Promise.all([api.listOffers({ size: 1 }), api.recommendations(DEFAULT_QUERY, 4)])
  .then(([list, iaResults]) => {
    setRecommendations(iaResults.map((r) => ({
      id: r.id, title: r.title, company: r.company,
      location: r.location, contract_type: r.contract_type,
      salary: r.salary, published_at: null
      // Pas de ai_score transmis volontairement — requête générique = score non significatif
    })));
  });
```

**Avant** (abandonné) : les recommandations du dashboard utilisaient `computeOfferScore()`, une
fonction JS calculant un score heuristique basé sur des mots-clés fixes. Ce score était **identique
quelle que soit la requête** — il évaluait la "qualité" globale de l'offre (ancienneté, salaire
renseigné, longueur de la description) et non sa pertinence par rapport à ce que cherchait l'utilisateur.

```typescript
// Ancienne approche — abandonnée
function computeOfferScore(offer: Offer): number {
  const keywords = ["react", "python", "docker", "typescript"];
  const matches = keywords.filter(k => text.includes(k)).length;
  const keywordScore = Math.min(40, matches * 6);
  const salaryScore = offer.salary ? 10 : 0;
  const ageScore = ...; // bonus si récent
  return keywordScore + salaryScore + ageScore;
}
```

**Problème** : une offre React obtenait toujours le même score, que l'utilisateur cherche "Python"
ou "React". Ce n'était pas un indicateur de pertinence, mais un indicateur de "richesse" de l'offre.

---

## Métriques de succès

| Métrique | Objectif | État actuel |
|---|---|---|
| Temps de réponse `/score` (1800+ offres) | < 500ms | ~300-400ms ✅ |
| Cohérence topN pour requête connue | Paris avant Lille sur "stage python paris" | Validé manuellement ✅ |
| Score affiché uniquement si pertinent | Score absent en navigation générale | Corrigé ✅ |
| Tests backend passants | 100% | 17/17 ✅ |

---

## Abandonné en cours de route

### Score personnalisé par utilisateur

**Idée initiale** : utiliser le profil de l'utilisateur (compétences renseignées, ville, niveau)
pour pondérer les recommandations. Par exemple, un utilisateur à Paris en 3ème année d'Epitech
cherchant un stage Python verrait automatiquement les offres correspondantes sans taper de recherche.

**Pourquoi abandonné** :
- Nécessite un système de profil utilisateur complet (formulaire, stockage, mise à jour)
- Le délai projet ne permettait pas de développer cette fonctionnalité correctement
- Risque de surcharger l'UX avec un formulaire de profil obligatoire

**Ce qui a été fait à la place** : requête générique `"développeur web fullstack stage CDI"` sur le
dashboard, qui retourne des offres raisonnablement pertinentes sans profil utilisateur.

---

### Score affiché sur toutes les cartes (même sans recherche)

**Problème observé** : après l'intégration du microservice IA, le score s'affichait sur toutes
les cartes d'offres — y compris en navigation générale (sans requête), et sur le dashboard avec
la requête générique. Cela donnait des scores comme "71/100", "69/100", "67/100" sur le dashboard,
qui semblaient significatifs mais ne l'étaient pas (calculés sur une requête générique).

**Correction** : le score n'est maintenant affiché que si `offer.ai_score !== undefined`.
Les recommandations du dashboard transmettent les offres **sans le champ `ai_score`** intentionnellement.

```typescript
// OfferCard.tsx — affichage conditionnel
{offer.ai_score !== undefined ? (
  <div className="text-right">
    <div className="text-[10px] font-mono uppercase text-slate-muted">Score IA</div>
    <div className={`font-display text-xl font-bold ${scoreColor(offer.ai_score)}`}>
      {offer.ai_score}<span className="text-xs"> /100</span>
    </div>
  </div>
) : (<div />)}
```

---

## Limitations connues

- **Pas de personnalisation par utilisateur** : le dashboard utilise une requête générique fixe.
  Si l'utilisateur est un expert en sécurité réseau, il verra quand même des offres "fullstack web".
- **Embeddings statiques** : les vecteurs sont précalculés à l'ingestion (`POST /compute-embeddings`).
  Si une offre est mise à jour, il faut relancer le calcul manuellement.
- **Scores plafonnés en pratique** : même avec la transformation `sqrt()`, les scores dépassent
  rarement 80/100. C'est une caractéristique du modèle `all-MiniLM-L6-v2`, pas un bug.
- **Boost de localisation simpliste** : le boost est binaire (présent ou absent). Une ville à
  50km n'est pas distinguée d'une ville à 500km — seule la correspondance exacte de mot compte.

---

## Architecture technique

```
Navigateur
    │
    │ GET /api/recommendations?q=stage+python+paris&limit=50
    ▼
Backend Express (Node.js)
    │
    │ POST http://ia:8000/score
    │ { "query": "stage python paris", "limit": 50 }
    ▼
Microservice FastAPI (Python)
    │
    ├── encode(query) → vecteur 384 dimensions
    ├── pour chaque offre en base :
    │     cosine_similarity(query_vector, offer_vector)
    │     → sqrt(sim) × 100
    │     → ×1.3 si mot de la requête dans ville de l'offre
    └── retourne les N meilleures offres triées par score
    │
    ▼
Backend → Frontend
    { id, title, company, location, contract_type, salary, ai_score }
```

## Preuve dans le code

- `ia/main.py` — microservice FastAPI : health, compute-embeddings, score
- `ia/Dockerfile` — modèle pré-téléchargé au build
- `backend/src/routes/recommendations.ts` — route proxy `/api/recommendations`
- `backend/src/index.ts` — enregistrement de la route
- `frontend/app/offers/page.tsx` — bascule sur IA si `sort === "ia"` et requête non vide
- `frontend/app/dashboard/page.tsx` — recommandations IA sans score affiché
- `frontend/components/OfferCard.tsx` — affichage conditionnel du score
- `frontend/lib/score.ts` — retour direct du score IA si disponible
- `frontend/lib/types.ts` — champ `ai_score?: number` sur l'interface `Offer`
- `docker-compose.yml` — service `ia` sur le port 8000, réseau `app-network`

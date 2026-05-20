# Feature: Data & Analytics — Job Aggregator

## Status

Implemented (partial)

---

## Context and User Problem

When a user visits the Job Aggregator platform, they are faced with **1800+ job offers**
with no relevance indicator. They have no way of knowing which ones to look at first, or whether
the results of their search are truly suited to what they are looking for.

**Core question**: how do we help users evaluate the quality of an offer relative to their
search, without asking them to fill out a profile?

---

## Initial Hypothesis

> If we display a **relevance score** calculated against the user's query,
> they will be able to sort and prioritize offers more quickly.

Ideally this score would take the user's profile into account (skills, experience level,
preferred location). However, this feature was abandoned due to time constraints — see section
[Abandoned Along the Way](#abandoned-along-the-way).

---

## Implemented Features

### 1. AI Relevance Score ("AI Relevance" mode)

**Where**: `/offers` page → "AI Relevance" sort option

**How it works**:

When the user selects "AI Relevance" sorting and types a query:
1. The frontend calls `/api/recommendations?q=<query>&limit=50`
2. The backend proxies to the FastAPI microservice `POST http://ia:8000/score`
3. The microservice encodes the query and each offer into a numeric vector (embeddings)
4. It computes the **cosine similarity** between the query and each offer
5. It applies `sqrt(similarity) × 100` to get a readable score between 0 and 100
6. It applies a **location boost** (+30%) if a word from the query matches the offer's city
7. The frontend displays offers sorted by descending score, with the score visible on each card

**Concrete example** — Query: `"python internship paris"`:

| Offer | City | Raw Score | Final Score | Displayed |
|---|---|---|---|---|
| Software Engineer Python / FastAPI | Paris | 61 | 79 (boost ×1.3) | **79/100** ✅ |
| Experienced Python Developer | Lille | 69 | 69 | **69/100** |
| Full stack developer internship | Marseille | 60 | 60 | **60/100** |

Without the location boost, the Lille offer (higher semantic score) would appear first —
which was counter-intuitive for a query containing "paris".

**Files involved**:
- `ia/main.py` — FastAPI microservice (endpoint `/score`)
- `backend/src/routes/recommendations.ts` — proxy route
- `frontend/app/offers/page.tsx` — switches to AI if `sort === "ia"` AND query is non-empty
- `frontend/lib/score.ts` — returns `offer.ai_score` directly if available
- `frontend/components/OfferCard.tsx` — displays score only if `offer.ai_score !== undefined`

---

### 2. Personalized Recommendations on the Dashboard

**Where**: `/dashboard` page → "Recommended Offers" section

**How it works**:

When the dashboard loads, 4 offers are recommended via the AI microservice using a
generic query: `"web fullstack developer internship CDI"`. These offers are displayed without
a visible score, because the score from a generic query does not represent real relevance
for the specific user.

```typescript
// dashboard/page.tsx
const DEFAULT_QUERY = "web fullstack developer internship CDI";

Promise.all([api.listOffers({ size: 1 }), api.recommendations(DEFAULT_QUERY, 4)])
  .then(([list, iaResults]) => {
    setRecommendations(iaResults.map((r) => ({
      id: r.id, title: r.title, company: r.company,
      location: r.location, contract_type: r.contract_type,
      salary: r.salary, published_at: null
      // ai_score intentionally not passed — generic query = meaningless score
    })));
  });
```

**Before** (abandoned): dashboard recommendations used `computeOfferScore()`, a
JS function calculating a heuristic score based on fixed keywords. This score was **identical
regardless of the query** — it evaluated the overall "quality" of the offer (recency, salary
provided, description length) rather than its relevance to what the user was looking for.

```typescript
// Old approach — abandoned
function computeOfferScore(offer: Offer): number {
  const keywords = ["react", "python", "docker", "typescript"];
  const matches = keywords.filter(k => text.includes(k)).length;
  const keywordScore = Math.min(40, matches * 6);
  const salaryScore = offer.salary ? 10 : 0;
  const ageScore = ...; // bonus if recent
  return keywordScore + salaryScore + ageScore;
}
```

**Problem**: a React offer always got the same score whether the user searched for "Python"
or "React". It was not a relevance indicator — it was a measure of offer "richness".

---

## Success Metrics

| Metric | Target | Current State |
|---|---|---|
| Response time `/score` (1800+ offers) | < 500ms | ~300-400ms ✅ |
| Top result consistency for known query | Paris before Lille on "python internship paris" | Validated manually ✅ |
| Score only shown when meaningful | No score on general browsing | Fixed ✅ |
| Backend tests passing | 100% | 17/17 ✅ |

---

## Abandoned Along the Way

### User-personalized Score

**Initial idea**: use the user's profile (listed skills, city, level)
to weight recommendations. For example, a Paris-based 3rd-year Epitech student
looking for a Python internship would automatically see matching offers without typing a search.

**Why it was abandoned**:
- Requires a complete user profile system (form, storage, updates)
- Project timeline did not allow this feature to be developed properly
- Risk of overloading the UX with a mandatory profile form

**What was done instead**: generic query `"web fullstack developer internship CDI"` on the
dashboard, which returns reasonably relevant offers without a user profile.

---

### Score Displayed on All Cards (Even Without a Search)

**Problem observed**: after integrating the AI microservice, the score was displayed on all
offer cards — including during general browsing (no query), and on the dashboard with
the generic query. This produced scores like "71/100", "69/100", "67/100" on the dashboard,
which appeared significant but were not (calculated against a generic query).

**Fix**: the score is now only displayed if `offer.ai_score !== undefined`.
Dashboard recommendations intentionally send offers **without the `ai_score` field**.

```typescript
// OfferCard.tsx — conditional display
{offer.ai_score !== undefined ? (
  <div className="text-right">
    <div className="text-[10px] font-mono uppercase text-slate-muted">AI Score</div>
    <div className={`font-display text-xl font-bold ${scoreColor(offer.ai_score)}`}>
      {offer.ai_score}<span className="text-xs"> /100</span>
    </div>
  </div>
) : (<div />)}
```

---

## Known Limitations

- **No user personalization**: the dashboard uses a fixed generic query.
  If the user is a network security expert, they will still see "fullstack web" offers.
- **Static embeddings**: vectors are pre-computed at ingestion (`POST /compute-embeddings`).
  If an offer is updated, the computation must be re-run manually.
- **Scores capped in practice**: even with the `sqrt()` transformation, scores rarely exceed
  80/100. This is a characteristic of the `all-MiniLM-L6-v2` model, not a bug.
- **Simplistic location boost**: the boost is binary (present or absent). A city 50km away
  is not distinguished from one 500km away — only exact word matching counts.

---

## Technical Architecture

```
Browser
    │
    │ GET /api/recommendations?q=python+internship+paris&limit=50
    ▼
Express Backend (Node.js)
    │
    │ POST http://ia:8000/score
    │ { "query": "python internship paris", "limit": 50 }
    ▼
FastAPI Microservice (Python)
    │
    ├── encode(query) → 384-dimension vector
    ├── for each offer in the database:
    │     cosine_similarity(query_vector, offer_vector)
    │     → sqrt(sim) × 100
    │     → ×1.3 if query word matches offer city
    └── returns the top N offers sorted by score
    │
    ▼
Backend → Frontend
    { id, title, company, location, contract_type, salary, ai_score }
```

## Evidence in the Code

- `ia/main.py` — FastAPI microservice: health, compute-embeddings, score
- `ia/Dockerfile` — model pre-downloaded at build time
- `backend/src/routes/recommendations.ts` — proxy route `/api/recommendations`
- `backend/src/index.ts` — route registration
- `frontend/app/offers/page.tsx` — switches to AI if `sort === "ia"` and query is non-empty
- `frontend/app/dashboard/page.tsx` — AI recommendations without displayed score
- `frontend/components/OfferCard.tsx` — conditional score display
- `frontend/lib/score.ts` — direct return of AI score if available
- `frontend/lib/types.ts` — `ai_score?: number` field on the `Offer` interface
- `docker-compose.yml` — `ia` service on port 8000, `app-network`

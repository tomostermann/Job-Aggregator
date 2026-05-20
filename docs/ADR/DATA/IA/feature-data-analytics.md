# Feature: Data & Analytics — Job Aggregator

## Status

Implemented (partial)

---

## Context and User Problem

When a user visits the Job Aggregator platform, they are faced with **1800+ job offers**
and no way to know which ones are relevant to them. Without any indicator, they have no idea
which offers to look at first or whether the search results actually match what they are looking for.

**Core question**: how do we help users quickly identify which offers suit them,
without forcing them to fill out a profile first?

---

## Initial Hypothesis

> If we show a **relevance score** calculated based on the user's search query,
> they will be able to sort and prioritize offers more efficiently.

Ideally this score would also factor in the user's profile (skills, experience level, preferred location).
However, that part was dropped due to time constraints — see the
[Abandoned Along the Way](#abandoned-along-the-way) section.

---

## Implemented Features

### 1. AI Relevance Score ("AI Relevance" mode)

**Where**: `/offers` page → "AI Relevance" sort option

**How it works**:

When the user selects "AI Relevance" sorting and types a search:
1. The frontend (the part of the app the user sees) calls `/api/recommendations?q=<query>&limit=50`
2. The backend (the server-side logic) forwards the request to the AI microservice (a small independent Python server) at `POST http://ia:8000/score`
3. The microservice converts both the query and each offer into vectors (lists of numbers representing meaning)
4. It calculates a **cosine similarity** (a number between 0 and 1 measuring how close two meanings are) between the query and each offer
5. It applies `sqrt(similarity) × 100` to get a score between 0 and 100 that is easier to read
6. It applies a **location boost** (+30%) if a word from the query matches the offer's city
7. The frontend displays offers sorted from highest to lowest score, with the score shown on each card

**Concrete example** — Query: `"python internship paris"`:

| Offer | City | Raw Score | Final Score | Shown |
|---|---|---|---|---|
| Software Engineer Python / FastAPI | Paris | 61 | 79 (boost ×1.3) | **79/100** ✅ |
| Experienced Python Developer | Lille | 69 | 69 | **69/100** |
| Full stack developer internship | Marseille | 60 | 60 | **60/100** |

Without the location boost, the Lille offer (with a slightly higher semantic score) would appear first —
even though the user specifically searched for Paris.

**Files involved**:
- `ia/main.py` — AI microservice (`/score` endpoint)
- `backend/src/routes/recommendations.ts` — backend route that forwards to the microservice
- `frontend/app/offers/page.tsx` — switches to AI mode when `sort === "ia"` and a query exists
- `frontend/lib/score.ts` — returns `offer.ai_score` directly if it exists
- `frontend/components/OfferCard.tsx` — only shows the score if `offer.ai_score !== undefined`

---

### 2. Recommended Offers on the Dashboard

**Where**: `/dashboard` page → "Recommended Offers" section

**How it works**:

When the dashboard loads, 4 offers are fetched from the AI microservice using a
generic query: `"web fullstack developer internship CDI"`. These offers are shown **without a score**,
because a score from a generic query has no real meaning for any specific user — it would just be a number
with no value.

```typescript
// dashboard/page.tsx
const DEFAULT_QUERY = "web fullstack developer internship CDI";

Promise.all([api.listOffers({ size: 1 }), api.recommendations(DEFAULT_QUERY, 4)])
  .then(([list, iaResults]) => {
    setRecommendations(iaResults.map((r) => ({
      id: r.id, title: r.title, company: r.company,
      location: r.location, contract_type: r.contract_type,
      salary: r.salary, published_at: null
      // ai_score intentionally not passed — a score from a generic query is meaningless
    })));
  });
```

**Before** (abandoned): dashboard recommendations used `computeOfferScore()`, a
JavaScript function that calculated a score using fixed keyword rules. This score was **the same
no matter what the user searched for** — it measured the overall "richness" of the offer
(recency, salary listed, description length) rather than its relevance to the user.

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

**Problem**: a React offer always got the same score whether the user searched "Python" or "React".
This is not a relevance score — it is a quality score for the offer itself, independent of the search.

---

## Success Metrics

| Metric | Target | Current State |
|---|---|---|
| Response time on `/score` (1800+ offers) | < 500ms | ~300-400ms ✅ |
| Correct ranking for a known query | Paris before Lille on "python internship paris" | Validated manually ✅ |
| Score only shown when it means something | No score shown when browsing without a query | Fixed ✅ |
| Backend tests passing | 100% | 17/17 ✅ |

---

## Abandoned Along the Way

### User-personalized Score

**Initial idea**: use the user's saved profile (skills, city, level)
to personalize recommendations. For example, a 1st-year Epitech student in Paris
looking for a Python internship would automatically see relevant offers without typing anything.

**Why it was dropped**:
- Would require building a full profile system (form, database storage, update logic)
- Not enough time in the project schedule to do this properly
- Adds friction to the user experience with a mandatory form before seeing anything

**What was done instead**: a fixed generic query on the dashboard that returns
broadly relevant tech offers without needing any user data.

---

### Score Showing on All Cards (Even Without a Search)

**Problem**: after integrating the AI microservice, the score appeared on every offer card —
including when browsing without any search query, and on the dashboard with the generic query.
This produced scores like "71/100", "69/100", "67/100" that looked meaningful but were not
(they were calculated against a generic query, not the user's actual need).

**Fix**: the score is now only shown if `offer.ai_score !== undefined` (i.e. the field exists).
Dashboard recommendations deliberately do not pass the `ai_score` field when building the offer objects.

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

- **No user personalization**: the dashboard uses a fixed generic query. A network security expert
  will still see "fullstack web" offers because we don't know what they're looking for.
- **Static embeddings** (pre-computed vectors): vectors are calculated once at ingestion time. If an offer
  is updated later, the vectors must be manually recomputed by calling `POST /compute-embeddings` again.
- **Scores capped in practice**: even with the `sqrt()` transformation, scores rarely exceed 80/100.
  This is normal for this type of model — it does not mean the results are bad.
- **Simple location boost**: the boost is all-or-nothing. A city 50km away gets no boost,
  same as a city 500km away — only an exact word match triggers it.

---

## Technical Architecture

```
Browser (what the user sees)
    │
    │ GET /api/recommendations?q=python+internship+paris&limit=50
    ▼
Express Backend / Node.js (server-side logic)
    │
    │ POST http://ia:8000/score
    │ { "query": "python internship paris", "limit": 50 }
    ▼
FastAPI Microservice / Python (AI processing)
    │
    ├── encode(query) → 384-number vector
    ├── for each offer stored in the database:
    │     cosine_similarity(query_vector, offer_vector)  → number between 0 and 1
    │     → sqrt(result) × 100                          → readable score
    │     → ×1.3 if a query word matches the offer city → location boost
    └── returns the top N offers sorted by score
    │
    ▼
Backend → Frontend
    { id, title, company, location, contract_type, salary, ai_score }
```

## Evidence in the Code

- `ia/main.py` — FastAPI microservice: health check, compute-embeddings, score
- `ia/Dockerfile` — model downloaded at Docker build time
- `backend/src/routes/recommendations.ts` — `/api/recommendations` proxy route
- `backend/src/index.ts` — route registration in the main server file
- `frontend/app/offers/page.tsx` — switches to AI mode when `sort === "ia"` and query is not empty
- `frontend/app/dashboard/page.tsx` — AI recommendations without score displayed
- `frontend/components/OfferCard.tsx` — conditional score display
- `frontend/lib/score.ts` — returns the AI score directly if it exists
- `frontend/lib/types.ts` — `ai_score?: number` field on the `Offer` interface (TypeScript type definition)
- `docker-compose.yml` — `ia` service on port 8000, connected via `app-network`

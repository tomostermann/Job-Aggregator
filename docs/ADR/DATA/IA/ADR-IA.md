# ADR-IA: AI Model Choice for Job Offer Recommendations

## Status

Accepted

## Context

The Job Aggregator project aggregates tech job offers from the WeLoveDevs API (~1800+ offers in the database).
The goal is to provide users with recommendations **without asking them to fill out a profile**:
the user types a natural language search (e.g. "Python internship Paris backend") and the system
returns the most relevant offers, sorted by semantic similarity score.

### Initial Constraints

| Constraint | Reason |
|---|---|
| Size ≤ 500 MB | Reasonable Docker build, no memory overload |
| Result < 5 seconds per offer | No blocking latency for the user |
| No fine-tuning at startup | Simple deployment, container starts directly |
| Offline operation | No dependency on a paid external API |
| Python stack | We already have a FastAPI microservice, we stay within it |

---

## Decision

We use **`sentence-transformers` with the `all-MiniLM-L6-v2` model**.

### How It Works in Practice

1. **Computing offer embeddings** (done once via `POST /compute-embeddings`):
   - For each offer in the database, we concatenate its title + description
   - We encode this text into a 384-dimensional vector (an "embedding")
   - This vector is stored in the database in the `embedding` column (type `BYTEA`)

2. **Real-time scoring** (on each search via `POST /score`):
   - We encode the user's query into a vector
   - We compute the **cosine similarity** between this vector and each stored offer vector
   - We apply `sqrt(similarity) × 100` to get a score between 0 and 100
   - We apply a **location boost of +30%** if a word from the query matches the offer's city
   - We return the top N offers sorted by score

### Concrete Example

Query: `"python internship paris"`

| Offer | City | Raw Similarity | After sqrt×100 | After location boost | Final Score |
|---|---|---|---|---|---|
| Software Engineer Python / FastAPI | Paris | 0.38 | 61 | ×1.3 = **79** | 79 ✅ |
| Experienced Python Developer | Lille | 0.48 | 69 | no boost | 69 |
| Full stack developer internship | Marseille | 0.37 | 60 | no boost | 60 |

The most relevant result (Paris + Python) correctly ranks first.

### Characteristics of the Chosen Model

| Criterion | Value |
|---|---|
| Disk size | ~80 MB |
| Vector dimensions | 384 |
| Encoding time | ~2ms / offer |
| Fine-tuning required | No |
| Language | Multilingual (fr/en) |
| License | Apache 2.0 |

---

## Rejected Alternatives

### Alternative 1 — OpenAI API (`text-embedding-ada-002`)

**Description**: Use the OpenAI API to compute embeddings on the fly, without hosting a model.

**What we evaluated**:
- The API returns very high-quality embeddings (1536 dimensions)
- Integration is simple (a single HTTP request)
- No need to host a model

**Why we rejected it**:
- **Cost**: usage-based billing (~$0.0001 / 1000 tokens). For 1800 offers × long descriptions,
  the pre-computation cost is non-negligible, and above all we cannot afford a paid API
  in a student project with no budget
- **Network dependency**: if the OpenAI API is down, our feature is down
- **Latency**: each search = one HTTP round-trip (~200-500ms) instead of ~2ms locally
- **Privacy**: offer descriptions are sent to external servers

### Alternative 2 — TF-IDF + cosine similarity (scikit-learn)

**Description**: Classic keyword-matching approach with weighted terms,
without a deep learning model.

**What we evaluated**:
- Lightweight (~5 MB)
- Very fast
- No external dependency

**Why we rejected it**:

TF-IDF compares exact words, not concepts. Example:

```
Query: "backend developer"
Offer A: "Node.js Server Engineer"     → TF-IDF score = 0 (no words in common)
Offer B: "backend developer React"     → TF-IDF score = high (identical words)
```

With sentence-transformers:
```
Query: "backend developer"
Offer A: "Node.js Server Engineer"     → score = 62 (semantically close)
Offer B: "backend developer React"     → score = 78
```

TF-IDF would have returned 0 results for "server engineer" even though that is exactly
what the user was looking for. Unacceptable for a recommendation feature.

---

## Things We Tested and Abandoned

### Attempt 1 — Raw score × 100

Initially, the score was simply `cosine_similarity × 100`.

**Problem observed**: a similarity of 0.50 is actually an **excellent** match for this model,
but displayed as "50/100" which gave the impression of mediocre relevance.

```
# Before
similarity = 0.50
ai_score = int(0.50 * 100) = 50  ← looks weak to the user
```

**Solution adopted**: `sqrt()` transformation that spreads the range upward without distorting the order.

```
# After
similarity = 0.50
ai_score = int(sqrt(0.50) * 100) = int(0.707 * 100) = 70  ← more readable
```

### Attempt 2 — Min-max normalization

We also tried normalizing scores so that the best result always showed ~95
and the worst ~25, regardless of absolute values.

```python
# Formula tested
normalized = ((score - score_min) / (score_max - score_min)) * 70 + 25
```

**Problem**: this approach **falsifies the statistics**. If all offers are barely relevant,
the system still displays a score of 95 for the "best" one, which is misleading.

**Decision**: abandoned in favor of `sqrt()` which preserves the absolute meaning of scores.

### Attempt 3 — Client-side score (computeOfferScore)

Before integrating the microservice, we had a JS function on the frontend that calculated a score
based on manual rules (keyword presence, offer age, salary filled in...).

```typescript
// Score based on heuristics unrelated to the query
function computeOfferScore(offer: Offer): number {
  const keywords = ["react", "python", "docker"...];
  const matches = keywords.filter(k => text.includes(k)).length;
  const keywordScore = Math.min(40, matches * 6);
  // + bonus for recency, salary, long description...
}
```

**Problem**: this score was **identical for all queries**. Whether the user searched for
"Python" or "Java", a React offer always had the same score. It was useless as a relevance indicator.

**Decision**: replaced by the real AI score. The score is now only displayed if the offer
comes from a real search (`offer.ai_score !== undefined`).

---

## Known Limitations

- **Low absolute scores**: even with `sqrt()`, scores remain below 80 for most queries.
  This is inherent to the model and does not reflect poor quality.
- **Static embeddings**: vectors are computed at ingestion time. If an offer description changes,
  `POST /compute-embeddings` must be re-run.
- **No user personalization**: dashboard recommendations use a generic query
  (`"web fullstack developer internship CDI"`). The user profile is not taken into account
  (feature not developed).
- **Optimized for English**: the `all-MiniLM-L6-v2` model works multilingually but
  its performance is slightly better on English text.

---

## Evaluation Approach

### Manual Tests

| Query | Expected top result | Actual result | Consistent? |
|---|---|---|---|
| "python internship paris" | Python offer in Paris | Software Engineer Python / FastAPI — Paris | ✅ |
| "python internship paris" (before location boost) | Python offer in Paris | Experienced Python Dev — **Lille** | ❌ |
| "python internship paris" (after location boost) | Python offer in Paris | Software Engineer Python / FastAPI — Paris | ✅ |
| "react frontend developer" | React offer | Frontend Developer React | ✅ |

### The Location Problem and Its Fix

Before adding the boost, a Python offer in Lille could score higher than a Python offer in Paris,
because semantic similarity does not account for geographic location.

**Fix implemented**: we extract the words from the query and check if any of them
appears in the offer's city. If so, the score is multiplied by 1.3.

```python
query_words = ["internship", "python", "paris"]
location_text = "paris, france"

# "paris" is in query_words AND in location_text → boost applied
if any(word in location_text for word in query_words):
    base_score *= 1.3
```

### Measured Response Time

Tested with `curl` on 1800+ offers:
- `POST /score`: ~300-400ms (query embedding computation + full vector comparison)
- Target < 500ms: **achieved** ✅

---

## Evidence in the Code

- `ia/main.py` — complete FastAPI microservice (health, compute-embeddings, score)
- `ia/Dockerfile` — model pre-downloaded at build time (`RUN python -c "...SentenceTransformer(...)"`)
- `backend/src/routes/recommendations.ts` — proxy route to the microservice
- `frontend/app/offers/page.tsx` — switches to `/api/recommendations` in "AI Relevance" mode
- `frontend/components/OfferCard.tsx` — displays score only if `offer.ai_score !== undefined`
- `backend/src/config/schema.sql` — `embedding BYTEA` column on the `offers` table
- `docker-compose.yml` — `ia` service on port 8000, `app-network`

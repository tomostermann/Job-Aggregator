# ADR-IA: AI Model Choice for Job Offer Recommendations

## Status

Accepted

## Context

The Job Aggregator project collects tech job offers from the WeLoveDevs API (~1800+ offers stored in the database).
The goal is to suggest relevant offers to users **without asking them to fill out a profile**:
the user types a search in plain language (e.g. "Python internship Paris backend") and the system
returns the most relevant offers, sorted by a relevance score.

### Initial Constraints

| Constraint | Reason |
|---|---|
| Size ≤ 500 MB | The model must fit in the Docker container without using too much memory |
| Result in < 5 seconds | The user should not have to wait a long time |
| No fine-tuning at startup | The model must work right away, without retraining on our data |
| Works offline | No dependency on a paid external service |
| Python stack | We already have a FastAPI microservice, we stay within the same technology |

---

## Decision

We use **`sentence-transformers` with the `all-MiniLM-L6-v2` model**.

`sentence-transformers` is an open-source Python library that transforms a sentence into a list of numbers
(called a **vector** or **embedding**) that represents its meaning. Two sentences that mean the same thing
will produce similar vectors, even if they don't share any words.

### How It Works Step by Step

1. **Pre-computing offer embeddings** (done once via `POST /compute-embeddings`):
   - For each offer in the database, we join its title and description into one text
   - We convert this text into a vector of 384 numbers (an "embedding" — a numerical representation of the meaning)
   - This vector is saved in the database in the `embedding` column

2. **Real-time scoring** (on every search via `POST /score`):
   - We convert the user's query into a vector the same way
   - We compute the **cosine similarity** (a mathematical measure between 0 and 1 that indicates how close two vectors are) between the query and each stored offer
   - We apply `sqrt(similarity) × 100` to get a more readable score between 0 and 100
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
| Vector dimensions | 384 (i.e. each text is represented by 384 numbers) |
| Encoding time | ~2ms per offer |
| Fine-tuning required | No |
| Language | Multilingual (French and English) |
| License | Apache 2.0 (free, open-source) |

---

## Rejected Alternatives

### Alternative 1 — OpenAI API (`text-embedding-ada-002`)

**Description**: use OpenAI's paid API to compute embeddings, without hosting any model ourselves.

**What we evaluated**:
- The API produces very high-quality embeddings (1536 dimensions instead of 384)
- Very simple to integrate (one HTTP call)
- No need to download or host anything

**Why we rejected it**:
- **Cost**: the API charges per use (~$0.0001 per 1000 tokens). For 1800 offers with long descriptions,
  the pre-computation cost adds up quickly — and a paid API is not realistic for a student project with no budget
- **Network dependency**: if OpenAI's servers go down, our feature stops working too
- **Latency**: each search requires an HTTP round-trip to OpenAI's servers (~200-500ms), compared to ~2ms when running locally
- **Privacy**: offer descriptions are sent to external servers

### Alternative 2 — TF-IDF + cosine similarity (scikit-learn)

**Description**: a classic keyword-based search approach (TF-IDF stands for Term Frequency–Inverse Document Frequency —
it weights words by how often they appear and how unique they are across all documents). No deep learning involved.

**What we evaluated**:
- Very lightweight (~5 MB)
- Very fast
- No external dependency

**Why we rejected it**:

TF-IDF compares exact words, not meaning. Example:

```
Query: "backend developer"
Offer A: "Node.js Server Engineer"   → TF-IDF score = 0 (no words in common)
Offer B: "backend developer React"   → TF-IDF score = high (exact word match)
```

With sentence-transformers:
```
Query: "backend developer"
Offer A: "Node.js Server Engineer"   → score = 62 (semantically close, same job)
Offer B: "backend developer React"   → score = 78
```

TF-IDF would return 0 results for "server engineer" even though that is exactly
what the user is looking for. This is unacceptable for a recommendation feature.

---

## Things We Tested and Abandoned

### Attempt 1 — Raw score × 100

Initially, the score was simply `cosine_similarity × 100`.

**Problem**: for this type of model, a similarity of 0.50 is actually an **excellent** match,
but it displayed as "50/100" which made it look like a mediocre result to the user.

```
# Before
similarity = 0.50
ai_score = int(0.50 * 100) = 50  ← looks weak to the user
```

**Solution**: we apply a `sqrt()` (square root) transformation, which pushes the scores
upward without changing the ranking order.

```
# After
similarity = 0.50
ai_score = int(sqrt(0.50) * 100) = int(0.707 * 100) = 70  ← more readable
```

### Attempt 2 — Min-max normalization

We also tried rescaling scores so the best result always shows ~95
and the worst ~25, no matter the actual values.

```python
# Formula tested
normalized = ((score - score_min) / (score_max - score_min)) * 70 + 25
```

**Problem**: this approach **gives a false impression**. If all offers are barely relevant,
the system still shows a score of 95 for the "best" one — which is misleading.
A score of 95 should mean "very relevant", not "least bad".

**Decision**: abandoned in favor of `sqrt()` which keeps the real meaning of scores.

### Attempt 3 — Client-side score (computeOfferScore)

Before integrating the AI microservice, we had a JavaScript function in the frontend that calculated a score
using manual rules (keyword presence, offer age, whether a salary was listed...).

```typescript
// Score based on fixed rules, unrelated to the user's search
function computeOfferScore(offer: Offer): number {
  const keywords = ["react", "python", "docker"...];
  const matches = keywords.filter(k => text.includes(k)).length;
  const keywordScore = Math.min(40, matches * 6);
  // + bonus for recency, salary, long description...
}
```

**Problem**: this score was **the same for every query**. Whether the user searched for
"Python" or "Java", a React offer always got the same number. It measured offer "richness",
not relevance to the user's actual search.

**Decision**: replaced by the real AI score. The score is now only shown if the offer
comes from an actual search (`offer.ai_score !== undefined`).

---

## Known Limitations

- **Low absolute scores**: even with `sqrt()`, scores rarely go above 80 for most queries.
  This is a characteristic of the model, not a sign of poor results.
- **Static embeddings**: vectors are computed when an offer is ingested. If an offer's description changes,
  `POST /compute-embeddings` must be re-run to update it.
- **No user personalization**: dashboard recommendations use a generic query
  (`"web fullstack developer internship CDI"`). The user's actual profile is not taken into account
  (this feature was not built).
- **Better in English**: the `all-MiniLM-L6-v2` model supports multiple languages but performs
  slightly better on English text than French.

---

## Evaluation Approach

### Manual Tests

| Query | Expected top result | Actual result | Correct? |
|---|---|---|---|
| "python internship paris" | Python offer in Paris | Software Engineer Python / FastAPI — Paris | ✅ |
| "python internship paris" (before location boost) | Python offer in Paris | Experienced Python Dev — **Lille** | ❌ |
| "python internship paris" (after location boost) | Python offer in Paris | Software Engineer Python / FastAPI — Paris | ✅ |
| "react frontend developer" | React offer | Frontend Developer React | ✅ |

### The Location Problem and Its Fix

Before adding the boost, a Python offer in Lille could score higher than a Python offer in Paris,
because the semantic similarity (the comparison of meanings) does not take geographic location into account.

**Fix**: we extract the words from the query and check whether any of them appears in the offer's city.
If so, the score is multiplied by 1.3.

```python
query_words = ["internship", "python", "paris"]
location_text = "paris, france"

# "paris" is in both query_words and location_text → boost applied
if any(word in location_text for word in query_words):
    base_score *= 1.3
```

### Measured Response Time

Tested with `curl` (a command-line tool to make HTTP requests) on 1800+ offers:
- `POST /score`: ~300-400ms (encoding the query + comparing it against all stored vectors)
- Target < 500ms: **achieved** ✅

---

## Evidence in the Code

- `ia/main.py` — full FastAPI microservice (health check, compute-embeddings, score)
- `ia/Dockerfile` — model downloaded at build time so it is available when the container starts
- `backend/src/routes/recommendations.ts` — backend route that forwards requests to the microservice
- `frontend/app/offers/page.tsx` — switches to `/api/recommendations` when "AI Relevance" mode is selected
- `frontend/components/OfferCard.tsx` — only shows the score if `offer.ai_score !== undefined`
- `backend/src/config/schema.sql` — `embedding BYTEA` column on the `offers` table
- `docker-compose.yml` — `ia` service on port 8000, connected via `app-network`

# ADR-Data: WeLoveDevs Data Integration Strategy

## Status

Accepted

---

## Context

The Job Aggregator project needs a reliable and high-volume source of tech job offers.
The goal is to display real offers to users, without creating them manually.

### Identified Constraints

| Constraint | Reason |
|---|---|
| Real data source | Offers must exist, no fake data |
| Rate limit compliance | Avoid getting the API key banned |
| Structured storage | Fast queries, filters, integrity constraints |
| Automatable pipeline | No manual import on each update |
| Python/Node.js stack | Consistency with existing microservices |

---

## Decision

We use the **WeLoveDevs API** as the sole job offer source, with a Node.js (Express) ingestion
pipeline that fetches, normalizes, and stores data in PostgreSQL.

### WeLoveDevs Integration Strategy

WeLoveDevs exposes a public REST API listing French tech job offers.
We query it via `GET /jobs` with pagination to retrieve the full catalog.

**Parameters used**:
- `page` — result pagination
- `limit` — number of offers per page (maximum allowed)
- Authentication headers with the API key (`WELOVEDEVS_API_KEY` in `.env`)

**Volume**: ~1800+ offers available at the time of integration.

### Full Ingestion Flow

```
WeLoveDevs API
      │
      │  GET /jobs?page=N&limit=50
      ▼
  Fetcher (Node.js)
      │  Iterates through all pages until exhausted
      │
      ▼
  Normalizer
      │  Transforms each raw offer into a standardized internal format
      │  (title, company, location, contract type, salary, description)
      │
      ▼
  PostgreSQL
      │  INSERT INTO offers ... ON CONFLICT DO NOTHING
      │  (prevents duplicates if ingestion is re-run)
      ▼
  Database ready for user queries
```

### Rate Limit Management

The WeLoveDevs API enforces a limit of **1 request per second per student**.

To comply with this constraint, the pipeline inserts a 1-second delay between each
paginated call:

```typescript
// Delay between each page to respect the rate limit
await new Promise((resolve) => setTimeout(resolve, 1000));
```

Without this delay, the API returns `429 Too Many Requests` errors after a few pages,
which interrupts ingestion and can result in a temporary ban of the API key.

**Impact on ingestion time**: with ~1800 offers and 50 offers per page, this means
~36 calls, i.e. ~36 seconds for a complete ingestion. This delay is acceptable because
ingestion is triggered manually just once via `POST /api/admin/ingest`.

### Data Normalization

Raw offers from the WeLoveDevs API do not directly match our internal schema.
The normalizer transforms each offer by applying these rules:

| WeLoveDevs Field | Internal Field | Transformation |
|---|---|---|
| `title` | `title` | Whitespace trimming |
| `company.name` | `company` | Name extracted only |
| `profile.city` | `location` | City extracted from profile |
| `contract.type` | `contract_type` | Standardization (CDI, CDD, Internship...) |
| `salary.min/max` | `salary` | Formatted as readable string or null |
| `description` | `description` | Plain text, HTML stripped if needed |
| — | `source` | Fixed value `"welovedevs"` |
| — | `external_id` | Unique offer ID from WeLoveDevs |

The `external_id` column + `UNIQUE` constraint in the database prevents duplicates
across successive re-ingestions (`ON CONFLICT DO NOTHING` behavior).

### Triggering Ingestion

Ingestion is triggered manually via a protected admin endpoint:

```
POST /api/admin/ingest
Authorization: Bearer <JWT admin>
```

Only a user with the `admin` role can trigger ingestion.
The endpoint returns the number of offers inserted and the elapsed time.

---

## Additional Source

No additional source was integrated. WeLoveDevs provides sufficient coverage of the French
tech market for the project's needs (~1800 offers). Adding a second source
(e.g. Welcome to the Jungle) would have required a second normalizer and conflict management
between sources — complexity not justified for this project.

---

## Rejected Alternative — Web Scraping

**Description**: instead of using an official API, fetch offers by parsing the HTML pages
of sites like Indeed, LinkedIn Jobs, or WTTJ directly.

**What we evaluated**:
- No API key required
- Access to more sources simultaneously
- Much larger potential volume

**Why we rejected it**:

- **Legal uncertainty**: scraping violates the terms of service of most platforms.
  In the context of an evaluated Epitech project, using illegally obtained data
  is an unacceptable risk.

- **Fragility**: a DOM change breaks the scraper. The WeLoveDevs API is stable
  and versioned.

- **Maintenance**: a multi-source scraper requires one parser per site, each one
  to maintain separately. The WeLoveDevs API provides a uniform format.

- **Uncontrollable rate limiting**: an aggressive scraper can result in a permanent IP ban,
  with no recourse. With the official API, the rate limit is documented and
  handled programmatically.

**Conclusion**: the WeLoveDevs API provides a legal, stable, and sufficient framework
for the project's target volume.

---

## Known Limitations

- **Static data**: ingestion is manual. New offers published on WeLoveDevs are not
  automatically fetched — `POST /api/admin/ingest` must be re-run.
- **No removal of expired offers**: if an offer is taken down from WeLoveDevs,
  it remains in the database. A synchronization mechanism (diff between API and database)
  was not implemented.
- **Single source**: if the WeLoveDevs API is unavailable, no new offers can be ingested.
- **Salaries often null**: many companies do not provide salary information on WeLoveDevs,
  which impacts the quality of displayed data.

---

## Evidence in the Code

- `backend/src/routes/admin.ts` — `POST /api/admin/ingest` endpoint
- `backend/src/services/ingestion.ts` — fetch → normalize → insert pipeline
- `backend/src/services/normalizer.ts` — raw offer transformation
- `backend/src/config/schema.sql` — `offers` table with `UNIQUE(external_id)` constraint
- `backend/tests/normalizer.test.ts` — normalizer unit tests
- `docker-compose.yml` — `WELOVEDEVS_API_KEY` variables passed to the backend

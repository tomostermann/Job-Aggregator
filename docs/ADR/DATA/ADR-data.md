# ADR-Data: WeLoveDevs Data Integration Strategy

## Status

Accepted

---

## Context

The Job Aggregator project needs a reliable source of real tech job offers to display to users.
The goal is to populate the database automatically, without entering offers by hand.

### Identified Constraints

| Constraint | Reason |
|---|---|
| Real data source | Offers must actually exist — no fake or placeholder data |
| Rate limit compliance | Sending too many requests too fast can get our API key banned |
| Structured storage | Fast queries, filters, and data integrity for the database |
| Automatable pipeline | No manual copy-paste every time we want to update the data |
| Python/Node.js stack | Consistency with the technologies already used in the project |

---

## Decision

We use the **WeLoveDevs API** as the sole source of job offers, with a Node.js (Express) ingestion
pipeline that fetches, normalizes (cleans and reformats), and stores the data in PostgreSQL.

### WeLoveDevs Integration Strategy

WeLoveDevs is a French job board for tech profiles. It exposes a public REST API
(a programming interface accessible via HTTP requests) that lists available offers.
We query it using `GET /jobs` with pagination (page by page) to retrieve the full catalog.

**Parameters used**:
- `page` — which page of results to fetch
- `limit` — how many offers per page (we use the maximum allowed)
- Authentication headers with our API key (`WELOVEDEVS_API_KEY` stored in the `.env` file)

**Volume**: ~1800+ offers available at the time of integration.

### Full Ingestion Flow

```
WeLoveDevs API
      │
      │  GET /jobs?page=N&limit=50
      ▼
  Fetcher (Node.js)
      │  Loops through all pages until there are no more results
      │
      ▼
  Normalizer
      │  Cleans and reformats each raw offer into our internal structure
      │  (title, company, location, contract type, salary, description)
      │
      ▼
  PostgreSQL (our database)
      │  INSERT INTO offers ... ON CONFLICT DO NOTHING
      │  (skips duplicates if ingestion is run more than once)
      ▼
  Database ready for user queries
```

### Rate Limit Management

The WeLoveDevs API allows a maximum of **1 request per second per student**.
A rate limit (request frequency cap) exists to prevent servers from being overloaded.

To stay within this limit, the pipeline waits 1 second between each page request:

```typescript
// Wait 1 second between each page to respect the rate limit
await new Promise((resolve) => setTimeout(resolve, 1000));
```

Without this delay, the API returns `429 Too Many Requests` errors (a standard HTTP error meaning
"slow down") after a few pages, which stops the ingestion and can result in a temporary ban of the API key.

**Impact on ingestion time**: with ~1800 offers and 50 offers per page, that is ~36 requests,
meaning ~36 seconds for a full ingestion. This is acceptable because ingestion is triggered
manually just once via `POST /api/admin/ingest`, not on every page load.

### Data Normalization

Raw offers from the WeLoveDevs API do not directly match our internal database structure.
The normalizer (a function that transforms data from one format to another) applies these rules:

| WeLoveDevs Field | Internal Field | Transformation |
|---|---|---|
| `title` | `title` | Whitespace trimmed |
| `company.name` | `company` | Company name extracted |
| `profile.city` | `location` | City extracted from the profile object |
| `contract.type` | `contract_type` | Standardized label (CDI, CDD, Internship...) |
| `salary.min/max` | `salary` | Formatted as a readable string, or null if missing |
| `description` | `description` | Plain text, HTML tags removed if present |
| — | `source` | Fixed value `"welovedevs"` to track where the offer came from |
| — | `external_id` | The offer's unique ID from WeLoveDevs, used to avoid duplicates |

The `external_id` column has a `UNIQUE` constraint in the database, meaning PostgreSQL will
automatically reject any duplicate offer if ingestion is run again (`ON CONFLICT DO NOTHING`).

### Triggering Ingestion

Ingestion is started manually through a protected admin endpoint
(a URL only accessible to admin users):

```
POST /api/admin/ingest
Authorization: Bearer <JWT token>
```

A JWT (JSON Web Token) is a secure token that proves the user is logged in and has admin rights.
Only a user with the `admin` role can trigger this endpoint.
The response includes the number of offers inserted and how long the process took.

---

## Additional Source

No additional source was integrated. WeLoveDevs covers enough of the French tech job market
for the project's needs (~1800 offers). Adding a second source (e.g. Welcome to the Jungle)
would have required a second normalizer and logic to handle conflicts between sources —
complexity that was not justified for a student project.

---

## Rejected Alternative — Web Scraping

**Description**: instead of using an official API, scraping means writing code that visits
a website like a browser would, reads the HTML page content, and extracts data from it directly.
We considered doing this on sites like Indeed, LinkedIn Jobs, or WTTJ.

**What we evaluated**:
- No API key needed
- Access to more sources at once
- Potentially much larger volume of offers

**Why we rejected it**:

- **Legal uncertainty**: scraping violates the terms of service of most platforms.
  In the context of a graded Epitech project, using data obtained this way
  is an unacceptable risk.

- **Fragility**: any change to the website's HTML structure breaks the scraper.
  The WeLoveDevs API is stable and explicitly designed for programmatic access.

- **Maintenance overhead**: a multi-source scraper requires one custom parser per site,
  each needing its own maintenance. The WeLoveDevs API provides a consistent, documented format.

- **Uncontrollable rate limiting**: an aggressive scraper can result in a permanent IP ban
  with no way to appeal. With an official API, the rate limit is clearly documented and
  easy to respect in code.

**Conclusion**: the WeLoveDevs API provides a legal, stable, and sufficient framework
for the project's target volume.

---

## Known Limitations

- **Data goes stale**: ingestion is manual. New offers published on WeLoveDevs after the last
  ingestion will not appear — someone has to re-run `POST /api/admin/ingest`.
- **No cleanup of expired offers**: if an offer is removed from WeLoveDevs, it stays in our database.
  A sync mechanism (comparing what is in the API vs. what is in the database) was not built.
- **Single source dependency**: if the WeLoveDevs API is down or changes its format,
  no new offers can be ingested at all.
- **Salaries often missing**: many companies do not fill in salary information on WeLoveDevs,
  so the `salary` field is `null` for a large portion of offers.

---

## Evidence in the Code

- `backend/src/routes/admin.ts` — `POST /api/admin/ingest` endpoint
- `backend/src/services/ingestion.ts` — fetch → normalize → insert pipeline
- `backend/src/services/normalizer.ts` — raw offer transformation logic
- `backend/src/config/schema.sql` — `offers` table with `UNIQUE(external_id)` constraint
- `backend/tests/normalizer.test.ts` — unit tests for the normalizer
- `docker-compose.yml` — `WELOVEDEVS_API_KEY` environment variable passed to the backend

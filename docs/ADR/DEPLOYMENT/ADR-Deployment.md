# Deployment — Vercel + Render

## Why two platforms? Isn't Vercel enough?

### The role of each platform

**Vercel** is made exclusively for the **frontend**. It hosts static files and Next.js code. It knows how to display pages, handle React rendering, CSS, and images. It cannot run a real server.

**Render** runs a **Node.js process that runs continuously** — our Express backend with all the `/api/auth`, `/api/offers`, etc. routes. It also manages the connection to PostgreSQL.

### Why not everything on Vercel?

Vercel offers "API Routes" but they work as **serverless functions** — each request starts a new process, executes the function, then stops.

Our Express backend is not compatible with that because:
- It maintains a **PostgreSQL connection pool** permanently
- It has **global middlewares** (auth, rate limiting, CORS)
- It uses `express-rate-limit` which needs persistent memory between requests
- It handles **JWT** which requires a continuously running server

**In one sentence: Vercel serves the pages, Render runs the server and the database.**

---

# Backend Deployment — Render

## Why Render instead of Railway?

### Context
The project was initially configured for **Railway** but Railway imposes a **$5 free credit limit** before blocking the service, which is not viable for a project in development.

### Advantages of Render

**1. Free without blocking**
Railway cuts the service once the credit runs out. Render offers a permanent Free plan as long as the service stays within the limits.

**2. Automatic Dockerfile detection**
Render detects the `Dockerfile` at the root of the repo without additional configuration. No specific config file needed.

**3. Integrated PostgreSQL**
Render provides a PostgreSQL service directly in the dashboard, in the same region as the backend. The connection goes through the internal network (Internal Database URL) — faster and more secure than an external connection.

**4. Standard `DATABASE_URL`**
Render automatically injects a `DATABASE_URL` that the backend consumes directly. The code also supports separate variables (`DB_HOST`, `DB_USER`, etc.) for local development with docker-compose.

**5. Automatic deployment**
Each `git push` on `main` automatically triggers a new deployment.

---

## Free plan limits

### Web Service (Backend)

| Criteria | Limit |
|---|---|
| RAM | 512 MB |
| CPU | Shared (pooled) |
| Bandwidth | 100 GB / month |
| Inactivity | Sleep after **15 min** without a request |
| Wake up after sleep | **50+ seconds** for the 1st request |
| Instances | 1 only |

### PostgreSQL

| Criteria | Limit |
|---|---|
| Storage | 1 GB |
| RAM | 256 MB |
| Simultaneous connections | 97 max |
| Lifetime | **90 days** then automatic deletion |
| Backups | Not included |

---

## Load test results

Tests performed on `/api/offers` (with database queries):

| Simultaneous users | Requests/sec | Median time | Failures | Verdict |
|---|---|---|---|---|
| 20 | 37 req/s | 370 ms | 0 | ✅ Perfect |
| 50 | 72 req/s | 581 ms | 0 | ✅ Good |
| 100 | 97 req/s | 927 ms | 0 | ⚠️ Limit |

**Conclusion:** the comfortable limit is **50 simultaneous users** with DB. At 100 users the service holds but response times exceed one second.

# Job Aggregator

A fullstack job and internship aggregator platform built for Epitech — collecting, normalizing, and surfacing offers to help developers make better career decisions.

---

## Tech Stack

| Layer    | Technology              |
| -------- | ----------------------- |
| Frontend | Next.js (React)         |
| Backend  | Express (Node.js)       |
| Database | PostgreSQL              |
| DevOps   | Docker & Docker Compose |

---

## Prerequisites

Make sure you have the following installed:

- [Docker](https://www.docker.com/) >= 24.x
- [Docker Compose](https://docs.docker.com/compose/) >= 2.x
- [Node.js](https://nodejs.org/) >= 20.x (for local development without Docker)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/EpitechBachelorPromo2028/B-YEP-200-MLH-2-1-jobaggregator-1.git
cd B-YEP-200-MLH-2-1-jobaggregator-1
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in the required values in your `.env` file (see [Environment Variables](#environment-variables)).

### 3. Start the full stack

**Development** (with live reload):

```bash
docker compose up --build
```

**Production** (detached mode):

```bash
docker compose up --build -d
```

**Stop the stack:**

```bash
docker compose down
```

| Service  | URL                   |
| -------- | --------------------- |
| Frontend | http://localhost:3000 |
| Backend  | http://localhost:5001 |
| Database | localhost:5432        |
| Adminer  | http://localhost:8282 |

---

## Project Structure

```
/
├── frontend/         # Next.js app (React)
├── backend/          # Express REST API (Node.js)
├── docs/             # Project documentation
│   └── adr/          # Architecture Decision Records
│   └── market-scan/          # Market Analysis & Benchmark
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
DB_USER=           # PostgreSQL username
DB_PASSWORD=       # PostgreSQL password
DB_NAME=           # PostgreSQL database name
DB_HOST=db         # Docker service name (do not change)
DB_PORT=5432       # PostgreSQL port

# TODO: add WeLoveDevs API key once obtained
WELOVEDEVS_API_KEY=
```

> ⚠️ Never commit your `.env` file. It is listed in `.gitignore`.

---

## API

Base URL: `http://localhost:5000/api`

> Full API documentation — TODO

---

## Documentation

All decision records and product documentation are available in the [`docs/`](./docs) folder.

| Document                                                   | Description              |
| ---------------------------------------------------------- | ------------------------ |
| [`docs/adr/ADR-001-stack.md`](./docs/adr/ADR-001-stack.md) | Technical stack decision |
| `docs/adr/ADR-002-database.md`                             | Database choice — TODO   |
| `docs/market-scan.md`                                      | Competitive analysis     |

---
## URL

The application is hosted on Vercel: [https://job-aggregator-test.vercel.app/](https://job-aggregator-test.vercel.app/)
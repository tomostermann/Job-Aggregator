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
├── backend/                  # Express REST API (Node.js)
│   ├── src/
│   │   ├── admin/            # Admin routes
│   │   ├── auth/             # Authentication logic
│   │   ├── config/           # DB config, env, schema
│   │   ├── data/             # Data ingestion & normalization
│   │   ├── middlewares/      # Express middlewares
│   │   ├── offers/           # Offer routes
│   │   ├── routes/           # Route definitions
│   │   ├── saved/            # Saved offers routes
│   │   └── utils/            # Utility functions
│   ├── tests/                # Automated tests
│   │   ├── normalizer.api.test.js
│   │   ├── normalizer.unit.test.js
│   │   └── routes.test.ts
│   └── Dockerfile
├── frontend/                 # Next.js app (React)
│   ├── app/                  # Next.js pages
│   │   ├── admin/
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── offers/
│   │   ├── register/
│   │   ├── saved/
│   │   └── settings/
│   ├── components/           # Reusable UI components
│   │   ├── ApplyModal.tsx
│   │   ├── AppShell.tsx
│   │   ├── Charts.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── Navbar.tsx
│   │   ├── OfferCard.tsx
│   │   └── ...
│   ├── lib/                  # Helpers, context, types
│   └── Dockerfile
├── ia/                       # AI feature (Python)
│   ├── main.py
│   └── requirements.txt
├── docs/                     # Project documentation
│   ├── ADR/                  # Architecture Decision Records
│   │   ├── ACCESSIBILITY/
│   │   ├── ARCHITECTURE/
│   │   ├── CI/
│   │   ├── DATA/
│   │   ├── DEPLOYMENT/
│   │   └── SECURITE/
│   ├── features/
│   │   ├── feature-justification.md
│   │   └── value-proposition.md
│   └── market-scan/
│       └── market-scan-sourced.md
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
# Backend
JWT_SECRET=your_jwt_secret_here
PORT=5001

# Database
DB_HOST=jobaggregator-db
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# PostgreSQL (Docker)
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_DB=your_db_name

# WeLoveDevs API
WELOVEDEVS_API_KEY=your_api_key_here

# Admin
NODE_ENV=development
ADMIN_EMAIL=your_admin_email

# SMTP (optional - for email notifications)
# SMTP_HOST=sandbox.smtp.mailtrap.io
# SMTP_PORT=2525
# SMTP_USER=your_smtp_user
# SMTP_PASS=your_smtp_password
# SMTP_FROM=noreply@jobaggregator.local
# SMTP_SECURE=false
```

> ⚠️ Never commit your `.env` file. It is listed in `.gitignore`.

---

## API

Base URL: `http://localhost:5001/api`

| Method | Endpoint               | Description             |
| ------ | ---------------------- | ----------------------- |
| POST   | `/api/auth/register`   | Register a new user     |
| POST   | `/api/auth/login`      | Login and get JWT token |
| GET    | `/api/offers`          | List and search offers  |
| GET    | `/api/offers/:id`      | Get offer details       |
| POST   | `/api/offers/:id/save` | Save an offer           |
| GET    | `/api/saved`           | Get saved offers        |
| POST   | `/api/admin/ingest`    | Trigger data ingestion  |

---

## Documentation

All decision records and product documentation are available in the [`docs/`](./docs) folder.

| Document                                                                             | Description                   |
| ------------------------------------------------------------------------------------ | ----------------------------- |
| [`docs/ADR/ARCHITECTURE/`](./docs/ADR/ARCHITECTURE/)                                 | Technical stack decision      |
| [`docs/ADR/DATA/`](./docs/ADR/DATA/)                                                 | Data & WeLoveDevs integration |
| [`docs/ADR/SECURITE/`](./docs/ADR/SECURITE/)                                         | Security choices              |
| [`docs/ADR/CI/`](./docs/ADR/CI/)                                                     | CI/CD pipeline choices        |
| [`docs/ADR/ACCESSIBILITY/`](./docs/ADR/ACCESSIBILITY/)                               | Accessibility audits          |
| [`docs/ADR/DEPLOYMENT/`](./docs/ADR/DEPLOYMENT/)                                     | Deployment choices            |
| [`docs/features/value-proposition.md`](./docs/features/value-proposition.md)         | Value proposition             |
| [`docs/features/feature-justification.md`](./docs/features/feature-justification.md) | Feature justification         |
| [`docs/market-scan/`](./docs/market-scan/)                                           | Market analysis & benchmark   |

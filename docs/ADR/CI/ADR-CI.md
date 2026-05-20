# ADR-CI & Engineering Workflow

**Date:** May 18, 2026  

---

## Context

To prevent the `main` branch from breaking and to ensure unformatted code doesn't slip through the cracks, a robust CI pipeline is required. The goal is to automatically validate every Pull Request and direct push to `main`. 

We rely on GitHub Actions with three key steps: validating TypeScript compilation, running the linter, and executing the test suite (which currently covers our API routes and normalization logic).

---

## Decision

Everything is centralized within a single workflow file: `.github/workflows/ci.yml`. It triggers on any activity (`push` or `pull_request`) targeting `main`. Since the backend logic is isolated, all commands run inside the `./backend` directory.

---

## Automated Steps

### 1. Build Check
We run `npm run build:check` (which triggers `tsc --noEmit`). This allows us to catch TypeScript typing errors without generating unnecessary build files on the runner.

### 2. Linting
An `npm run lint` command (via ESLint) is executed across all `.ts` and `.js` files. The goal is to maintain clean, consistent formatting and catch obvious bugs before code review.

### 3. Test Suite
We execute `npm test` using Jest to collect coverage data (`--coverage`). The suite is split into two major components[cite: 1]:

* **Normalization Module** (`tests/normalizer.unit.test.js`): 18 test cases evaluating `normalizeOffer` and `stripHtml`[cite: 1]. It validates field mapping, salary formatting, HTML stripping, null value handling, and multi-value fields[cite: 1].
* **API Routes** (`tests/routes.test.ts`): 7 test cases validating the behavior of 3 strategic endpoints[cite: 1].

Here is the testing matrix for the HTTP layer[cite: 1]:

| Route | Test Scenario | Expected Result |
|---|---|---|
| `GET /offers` | Happy path | 200 + `{ data }` |
| `GET /offers` | Service crashes / throws an exception | 500 + `{ error }` |
| `GET /offers/:id` | Resource found | 200 + `{ title }` |
| `GET /offers/:id` | Resource not found | 404 + `{ error }` |
| `POST /offers` | Valid payload | 201 + created offer |
| `POST /offers` | Title too short | 400 + `{ error }` |
| `POST /offers` | Missing title in payload | 400 + `{ error }` |

> **Note on Isolation:** We use `jest.mock` to completely short-circuit the service layer[cite: 1]. Here, we are strictly testing the HTTP routing and controllers, not the database[cite: 1].

---

## Configuration File (Workflow)

```yaml
name: Job Aggregator CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: ./backend/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: ./backend

      - name: TypeScript check
        run: npm run build:check
        working-directory: ./backend

      - name: Linter
        run: npm run lint
        working-directory: ./backend

      - name: Unit & Integration tests
        run: npm test
        working-directory: ./backend

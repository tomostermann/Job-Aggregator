# ADR — CI and Engineering Workflow

**Date:** 2026-05-18  

---

## Context

The project requires a CI pipeline that protects code quality on every pull request and push to `main`. GitHub Actions is used with three automated steps: build check, lint, and tests covering two API routes and one normalization function.

---

## Decision

Single workflow `.github/workflows/ci.yml` triggered on `push` and `pull_request` to `main`. All steps run inside `./backend`.

---

## What Is Automated

### 1. Build Check

`npm run build:check` runs `tsc --noEmit` to catch TypeScript compilation errors before merging. No files written to disk.

### 2. Lint

`npm run lint` runs ESLint across `.ts` and `.js` files to enforce style consistency and catch obvious bugs early.

### 3. Tests

`npm test` runs Jest with `--coverage`. Two suites:

**Normalization** (`tests/normalizer.unit.test.js`) — 18 cases covering `normalizeOffer` and `stripHtml`: field mapping, salary formatting, HTML stripping, null handling, and multi-value fields.

**API Routes** (`tests/routes.test.ts`) — 7 cases across 3 endpoints:

| Route | Case | Expected |
|---|---|---|
| `GET /offers` | Standard | 200 + `{ data }` |
| `GET /offers` | Service throws | 500 + `{ error }` |
| `GET /offers/:id` | Found | 200 + `{ title }` |
| `GET /offers/:id` | Not found | 404 + `{ error }` |
| `POST /offers` | Valid body | 201 + offer |
| `POST /offers` | Title too short | 400 + `{ error }` |
| `POST /offers` | Missing title | 400 + `{ error }` |

The service layer is mocked via `jest.mock` — only HTTP controller behavior is tested.

---

## Workflow File

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
      - run: npm ci
        working-directory: ./backend
      - run: npm run build:check
        working-directory: ./backend
      - run: npm run lint
        working-directory: ./backend
      - run: npm test
        working-directory: ./backend
```

Merging to `main` is blocked if any step fails, enforced via GitHub branch protection rules.

---

## Key Trade-offs

- **No integration tests in v1** — mocks isolate the controller but don't test real DB behavior. A `docker-compose` setup in Actions is documented as a v2 evolution.
- **Husky not used** — pre-commit hooks can be bypassed with `--no-verify`; CI is the authoritative gate.
- **Vitest not considered** — project already uses Jest, no migration benefit.

---

## Success Metrics

- 0 merges possible on `main` with a failing step
- 18 normalization cases — PASS ✅
- 7 route cases across 3 endpoints — PASS ✅
- Jest coverage ≥ 70% on `normalizer.js`

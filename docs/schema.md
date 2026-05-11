# Database Schema

## Overview

The database uses **PostgreSQL** and contains 3 tables:

- `users` — platform accounts with role management
- `offers` — normalized job and internship listings
- `saved_offers` — junction table linking users to their saved offers

---

## Tables

### `users`

Stores registered user accounts.

| Column        | Type         | Constraints                                | Description                        |
| ------------- | ------------ | ------------------------------------------ | ---------------------------------- |
| id            | UUID         | PRIMARY KEY, DEFAULT gen_random_uuid()     | Unique user identifier             |
| email         | VARCHAR(255) | UNIQUE, NOT NULL                           | User email address                 |
| password_hash | VARCHAR(255) | NOT NULL                                   | Hashed password (never plain text) |
| role          | VARCHAR(50)  | DEFAULT 'user', CHECK IN ('user', 'admin') | Access role                        |
| created_at    | TIMESTAMP    | DEFAULT NOW()                              | Account creation date              |

**Roles:**

- `user` — can browse offers and use personal features
- `admin` — can access moderation and management features

---

### `offers`

Stores normalized job and internship listings ingested from external sources.

| Column        | Type         | Constraints                            | Description                                        |
| ------------- | ------------ | -------------------------------------- | -------------------------------------------------- |
| id            | UUID         | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique offer identifier                            |
| source_id     | VARCHAR(255) | UNIQUE                                 | Original ID from the source API (deduplication)    |
| title         | TEXT         | NOT NULL                               | Job title                                          |
| company       | TEXT         | —                                      | Company name                                       |
| location      | TEXT         | —                                      | Job location                                       |
| contract_type | TEXT         | —                                      | Contract type (internship, apprenticeship, CDI...) |
| description   | TEXT         | —                                      | Full job description                               |
| salary        | TEXT         | —                                      | Salary/remuneration when available                 |
| source        | VARCHAR(100) | —                                      | Data source (e.g. welovedevs)                      |
| published_at  | TIMESTAMP    | —                                      | Original publication date                          |
| created_at    | TIMESTAMP    | DEFAULT NOW()                          | Ingestion date                                     |

**Note:** `source_id` is UNIQUE to prevent duplicate ingestion from the same source.

---

### `saved_offers`

Junction table linking users to offers they have saved.

| Column   | Type      | Constraints                       | Description              |
| -------- | --------- | --------------------------------- | ------------------------ |
| user_id  | UUID      | FK → users(id) ON DELETE CASCADE  | Reference to the user    |
| offer_id | UUID      | FK → offers(id) ON DELETE CASCADE | Reference to the offer   |
| saved_at | TIMESTAMP | DEFAULT NOW()                     | Date the offer was saved |
| —        | —         | PRIMARY KEY (user_id, offer_id)   | Composite primary key    |

**Note:** Cascading deletes ensure saved offers are cleaned up if a user or offer is removed.

---

## Entity Relationship Diagram

```
users
  id (PK)
  email
  password_hash
  role
  created_at
    |
    | 1
    |
    * (user_id FK)
saved_offers
    * (offer_id FK)
    |
    | 1
    |
offers
  id (PK)
  source_id
  title
  company
  location
  contract_type
  description
  salary
  source
  published_at
  created_at
```

---

## Integrity Constraints

- `users.email` — UNIQUE, prevents duplicate accounts
- `offers.source_id` — UNIQUE, prevents duplicate ingestion
- `users.role` — CHECK constraint, only `user` or `admin` allowed
- `saved_offers` — composite PRIMARY KEY on (user_id, offer_id), prevents duplicate saves
- All foreign keys use `ON DELETE CASCADE` for automatic cleanup

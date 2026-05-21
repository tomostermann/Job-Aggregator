# ADR-001: Technical Stack Choice

## Status

Accepted



## Context

We are building a fullstack job aggregator platform with Docker.
Key constraints are: development speed, Epitech team skills,
containerized deployment, and a minimum of 3 Docker services required.

## Decision

We use Next.js (React) + Express (Node.js) + PostgreSQL.

## Why

- Next.js: large React ecosystem, familiar to the whole team,
  handles frontend routing and SSR efficiently
- Express: lightweight, flexible, well-documented, well-suited
  for building a clean REST API
- PostgreSQL: relational, robust, well-supported by Docker,
  explicit integrity constraints (required by the project specs)

## Rejected Alternative

Next.js (backend) + MongoDB was considered but rejected because:

- MongoDB is less suited for managing users/offers/roles relationships
- Using Next.js as backend reduces the architecture to 2 Docker
  services instead of the required minimum of 3
- MongoDB provides weaker data integrity guarantees out of the box

## Consequences

- We gain team consistency and full compliance with project constraints
- We lose some schema flexibility on the database side

## Evidence

- `docker-compose.yml` — defines the 3 required services (frontend, backend, db)
- `backend/package.json` — lists Express as dependency
- `frontend/package.json` — lists Next.js as dependency
- `backend/` — Express REST API source directory

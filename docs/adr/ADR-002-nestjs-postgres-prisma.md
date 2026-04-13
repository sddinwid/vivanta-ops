# ADR-002: NestJS + PostgreSQL + Prisma

- Status: Accepted
- Date: 2026-04-13

## Context

The platform needs typed APIs, structured module organization, and reliable relational modeling across many connected entities and permissions.

## Decision

Use:
- NestJS for backend framework and module composition
- PostgreSQL as primary operational datastore
- Prisma as ORM/schema/migration layer

## Consequences

- Positive: consistent TypeScript developer experience from API to persistence.
- Positive: relational integrity and clear migration history.
- Positive: predictable onboarding for new backend engineers.
- Tradeoff: some advanced DB behavior requires raw SQL/migration care.

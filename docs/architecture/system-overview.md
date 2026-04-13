# System Overview

## Purpose

Vivanta Operations OS is an internal operations platform for property management teams. The current implementation focuses on operational system-of-record capabilities rather than AI-heavy automation.

## High-Level Components

```text
[Web App: Next.js]
      |
      v
[NestJS API (/api/v1)]
  |  |  |  |
  |  |  |  +--> Auth / Access / Audit / Workflows / Portal
  |  |  +-----> Domain modules (properties, owners, documents, communications, cases, tasks, work orders, invoices, approvals)
  |  +--------> Prisma repositories
  v
[PostgreSQL]

[Temporal facade boundary] -> currently stub-first orchestration provider
[Redis] -> integration placeholder
```

## Why Modular Monolith

- Strong transactional consistency across tightly related operations
- Faster iteration for a small founding team
- Clear module-level boundaries without distributed-system overhead
- Ability to evolve toward externalized services later if needed

## Runtime Shape

- One backend deployable (`apps/api`)
- One frontend deployable (`apps/web`, currently placeholder surfaces)
- Local infra via Docker Compose: Postgres, Redis, Temporal, Temporal UI

## Current Operational Scope

Implemented domain scope includes:
- platform foundation (auth, access, audit)
- portfolio and directory (properties, owners, vendors)
- document metadata and linking
- communications threads/messages
- cases/tasks/work orders
- invoice + approval backbone
- workflow visibility + facade
- owner portal read projections

## Explicitly Deferred

- full workflow-driven execution in Temporal
- AI extraction/classification
- outbound notification and external delivery integrations
- accounting integrations
- tenant portal and richer frontend product surfaces

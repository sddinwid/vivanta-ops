# Vivanta Operations OS
A modular, workflow-oriented backend for property management operations, designed as a system of record and system of action.

## What This Project Is

Vivanta Operations OS is a working multi-tenant backend system for property operations.  
It is implemented as a NestJS modular monolith with PostgreSQL + Prisma and includes:

- operational domain modeling (properties, owners, vendors, units, etc.)
- documents and entity linking
- communications threads/messages/queues
- cases, tasks, and work orders
- invoice + approval backbone
- workflow visibility (`WorkflowRun`, `WorkflowEvent`) with orchestration facade
- owner portal projection API (read-only, owner-scoped)

It is designed as an internal operations system rather than a user-facing product, with APIs structured for future UI and automation layers.

## Why This Project Exists

Property management operations are process-heavy and fragmented across tools.  
Teams typically manage documents, vendor work, communications, and approvals through manual handoffs and inconsistent workflows.

This project is a practical foundation for:
- a **system of record** for operational state
- a **system of action** that can evolve into workflow-driven execution over time

## Design Principles

- System of record first
- Workflow-oriented architecture
- Modular monolith over premature microservices
- Projection APIs instead of exposing internal models
- Auditability by default
- Non-blocking orchestration (workflow hooks do not break domain logic)

## Architecture Overview

### Backend

- NestJS modular monolith (`apps/api`)
- Prisma + PostgreSQL persistence
- JWT auth + RBAC permissions + organization scoping
- consistent `/api/v1` routes, validation, and response envelope

### Workflow Layer

- `WorkflowRun` + `WorkflowEvent` tables for visibility
- workflow control endpoints (list/detail/events/retry/cancel)
- Temporal facade service with stub-first execution mode, ready for extension

### Storage

- local file storage adapter behind a storage abstraction
- structured so an S3-style adapter can be added without rewriting document module logic

### Frontend

- Next.js app exists as a placeholder surface (`apps/web`)
- not yet implemented as full product UI

## Implemented Modules

- Auth / RBAC / Audit
- Organizations / Users / Access
- Properties / Buildings / Units
- Owners / Vendors
- Documents + linking
- Communications (threads/messages/queues)
- Cases / Tasks / Work Orders
- Invoices + Approval flows
- Workflow visibility layer
- Owner portal read API

## Example Flow: Invoice Approval

1. Invoice is created.
2. Line items are added.
3. Invoice is submitted for review.
4. Invoice is submitted for approval.
5. `ApprovalFlow` + `ApprovalStep` records are created.
6. Approval decisions update invoice status.
7. A `WorkflowRun` is created for visibility (`invoice_processing`).

## Example End-to-End Flow

1. A communication thread is created in the `communications` module.
2. An operations user creates a case in the `cases` module for the same issue context.
3. A work order is created from that case in the `work-orders` module.
4. A vendor is assigned to the work order, with organization-level validation.
5. Workflow visibility is recorded via `WorkflowRun` and `WorkflowEvent`, enabling traceability across modules without tightly coupling execution logic.

## Workflow Architecture

Workflows are currently a **visibility + orchestration layer**:
- core domain transitions still execute in module services
- workflow records capture lifecycle visibility
- Temporal integration is behind a facade boundary

Not all business logic is in Temporal yet. The facade pattern is in place so selected flows can migrate incrementally later.

## Repository Structure

```text
apps/api
apps/web
packages/*
infra/docker
docs/*
```

## Local Setup

```bash
pnpm install
docker compose -f infra/docker/docker-compose.yml up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Optional first step:

```bash
cp .env.example .env
```

Local seeded admin credentials (dev only):
- email: `admin@vivanta.local`
- password: `ChangeMe123!`

## Implemented vs Deferred

### Implemented

- auth/access/audit foundation
- operational domain modules (properties, owners, vendors, documents, communications, cases, tasks, work orders)
- invoices + approvals backbone
- workflow visibility + facade layer
- owner portal read projections

### Deferred

- AI classification/extraction
- real Temporal workflows
- accounting integrations
- notifications
- tenant portal
- production infrastructure

## Tradeoffs and Decisions

- **Modular monolith vs microservices:** chosen to keep transaction boundaries simple and iteration speed high while domain boundaries stabilize.
- **Workflow visibility before full orchestration:** `WorkflowRun`/`WorkflowEvent` provide operational traceability now without forcing premature workflow-engine coupling.
- **Temporal behind a facade:** orchestration provider details are isolated so the system can migrate incrementally from stubbed behavior to real Temporal execution.
- **Projection APIs for portal access:** owner-facing endpoints intentionally shape and scope data instead of exposing internal operational models directly.
- **Audit-first design:** state-changing actions are recorded early so operational accountability and debugging remain reliable as complexity grows.

## Future Direction

- expand workflow orchestration from facade-first visibility to selected real Temporal executions
- layer in AI where it improves operator workflows
- add external integration adapters (accounting, delivery, notifications)
- build full portal and internal product UI surfaces on top of current APIs

---

This repository represents a backend foundation that can evolve into a full workflow-driven operations platform without requiring a rewrite of core domain logic.

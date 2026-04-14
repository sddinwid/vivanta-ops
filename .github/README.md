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
- workflow visibility (WorkflowRun, WorkflowEvent) with orchestration facade
- AI-assisted workflows with governed suggestion application
- owner portal projection API (read-only, owner-scoped)

It also includes a minimal operator UI to demonstrate real system usage.

## Why This Project Exists

Property management operations are process-heavy and fragmented across tools.  
Teams typically manage documents, vendor work, communications, and approvals through manual handoffs and inconsistent workflows.

This project is a practical foundation for:
- a system of record for operational state
- a system of action that can evolve into workflow-driven execution over time

## Design Principles

- System of record first
- Workflow-oriented architecture
- Modular monolith over premature microservices
- Projection APIs instead of exposing internal models
- Auditability by default
- AI-assisted, not AI-controlled
- Non-blocking orchestration (workflow hooks do not break domain logic)

## Architecture Overview

### Backend

- NestJS modular monolith (apps/api)
- Prisma + PostgreSQL persistence
- JWT auth + RBAC permissions + organization scoping
- consistent /api/v1 routes, validation, and response envelope

### Workflow Layer

- WorkflowRun + WorkflowEvent tables for visibility
- workflow control endpoints (list/detail/events/retry/cancel)
- Temporal facade service with stub-first execution mode

### AI Layer

- provider-agnostic AI architecture with pluggable providers
- AiRun + AiSuggestion persistence model
- prompt templates and provider configs stored in database
- capability-based execution (DOCUMENT_ANALYSIS, COMMUNICATION_ASSIST, etc.)
- assistive suggestions with explicit operator application
- evaluation and observability (AiEvaluation, scoring, feedback)

### Storage

- local file storage adapter behind abstraction
- designed for future S3-compatible storage integration

### Frontend

- Next.js operator UI (apps/web)
- thin interface for interacting with:
  - cases
  - documents
  - communications
  - AI runs
- intentionally minimal and backend-first

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
- AI foundation + assistive integrations
- Owner portal read API

## AI Capabilities

AI is implemented as an assistive layer across multiple domains:

- Document classification and extraction
- Communication triage and summarization
- Approval routing recommendations
- Case categorization and workflow suggestions

Key design characteristics:
- no automatic mutation of core domain state
- explicit apply endpoints for all AI suggestions
- full auditability of runs, suggestions, and operator decisions
- per-capability enable/disable controls
- evaluation system for feedback and iteration

## Example Flow: Invoice Approval

1. Invoice is created.
2. Line items are added.
3. Invoice is submitted for review.
4. AI suggests approval routing.
5. Operator reviews suggestion.
6. Invoice is submitted for approval.
7. ApprovalFlow + ApprovalStep records are created.
8. WorkflowRun is recorded for visibility.

## Example End-to-End Flow

1. A communication thread is created.
2. AI generates triage and summary suggestions.
3. An operator creates a case from the issue.
4. AI suggests categorization and priority.
5. A work order is created from the case.
6. A vendor is assigned.
7. WorkflowRun and WorkflowEvent track lifecycle.

## Workflow Architecture

Workflows are currently a visibility + orchestration layer:
- domain logic executes in module services
- workflow records capture lifecycle visibility
- Temporal integration is abstracted behind a facade

## Repository Structure

apps/api  
apps/web  
packages/*  
infra/docker  
docs/*  

## Local Setup

pnpm install  
docker compose -f infra/docker/docker-compose.yml up -d  
pnpm db:migrate  
pnpm db:seed  
pnpm dev  

Optional:

cp .env.example .env  

## Implemented vs Deferred

### Implemented

- auth/access/audit foundation
- operational domain modules
- AI foundation and assistive integrations
- workflow visibility and orchestration facade
- minimal operator UI

### Deferred

- production AI providers
- real Temporal workflow execution
- accounting integrations
- notifications
- tenant portal UI
- production infrastructure

## Tradeoffs and Decisions

- Modular monolith for speed and simplicity
- Workflow visibility before full orchestration
- AI as assistive layer, not autonomous system
- Provider abstraction to avoid vendor lock-in
- Projection APIs for safe external exposure

## Future Direction

- expand AI capabilities with real providers
- move selected workflows into Temporal execution
- integrate external systems (accounting, payments)
- build full operator and owner-facing UI
- introduce predictive and optimization workflows

---

This repository represents a backend foundation for a workflow-driven, AI-assisted operations platform.

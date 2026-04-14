# Vivanta Operations OS
A modular, workflow-oriented system of record and system of action for property management operations, with an integrated assistive AI layer.

---

## What This Project Is

Vivanta Operations OS is a working multi-tenant backend system for property operations.

It is implemented as a NestJS modular monolith with PostgreSQL + Prisma, and includes:

- operational domain modeling (properties, owners, vendors, units)
- documents and entity linking
- communications threads, messages, and queues
- cases, tasks, and work orders
- invoice and approval workflows
- workflow visibility (WorkflowRun, WorkflowEvent)
- owner portal projection APIs
- a governed, assistive AI subsystem

This is designed as an internal operations system, not a UI product, with APIs structured for:
- operator workflows
- automation layers
- future platformization

---

## Why This Project Exists

Property management operations are:
- process-heavy
- fragmented across tools
- dependent on manual coordination

Critical workflows like:
- document handling
- vendor coordination
- invoice approvals
- communication triage

are typically handled through disconnected systems.

This project consolidates those workflows into a single operational backbone that enables:

- consistent execution
- auditability
- structured data flow
- safe AI-assisted decision support

---

## Design Principles

- System of record first
- Workflow-oriented architecture
- Modular monolith over premature microservices
- Projection APIs instead of exposing internal models
- Auditability by default
- AI-assisted, not AI-dependent
- Non-blocking orchestration (AI and workflows never break domain logic)

---

## Architecture Overview

### Backend

- NestJS modular monolith (apps/api)
- Prisma + PostgreSQL persistence
- JWT auth + RBAC permissions
- strict organization scoping
- consistent /api/v1 routing + response envelope

---

### Workflow Layer

- WorkflowRun + WorkflowEvent for lifecycle visibility
- workflow control endpoints (list, detail, retry, cancel)
- orchestration facade pattern
- Temporal-ready, but not tightly coupled

---

### Storage

- storage abstraction layer
- local adapter implemented
- designed for S3-compatible replacement

---

### Frontend

- Next.js placeholder (apps/web)
- backend-first system
- APIs structured for future UI and automation surfaces

---

## AI Integration Layer

The system includes a first-class, governed AI subsystem designed to assist—not replace—operator workflows.

### Core AI Architecture

- Provider abstraction layer  
  pluggable providers (stub implemented)  
  no direct dependency on external AI services  

- Prompt management  
  versioned prompt templates  
  capability-scoped templates  
  active/inactive control  

- Execution tracking  
  AiRun (execution record)  
  AiSuggestion (structured outputs)  
  AiEvaluation (human feedback loop)  

- Capability-based execution  
  document analysis  
  communication assist  
  approval routing  
  case recommendations  

- Feature control  
  per-capability enable/disable  
  organization-scoped configuration  
  safe fallback behavior  

---

### AI Design Philosophy

- AI is assistive, never authoritative  
- all outputs are explicitly applied by operators  
- all actions are auditable  
- AI never mutates domain state without user intent  
- workflows remain deterministic and reliable  

---

## AI-Assisted Features

### Documents
- classification suggestions
- invoice-style extraction
- controlled application of results

### Communications
- triage recommendations
- summarization
- safe priority adjustment (operator-controlled)

### Invoices / Approvals
- approval routing recommendations
- multi-step vs single-step suggestions
- no automatic approval flow mutation

### Cases
- case categorization
- priority recommendations
- workflow guidance (non-executing)

---

## AI Observability and Control

The platform includes built-in AI governance:

- run tracking and summaries
- suggestion visibility
- evaluation system (positive / negative / mixed)
- per-capability enable/disable
- prompt template management
- provider configuration management

Example endpoints:

GET /api/v1/ai/runs/summary  
GET /api/v1/ai/capabilities  
POST /api/v1/ai/runs/:id/evaluations  

This enables:
- performance monitoring
- human feedback loops
- safe iterative improvement

---

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
- AI foundation + integrations

---

## Example Flow: Invoice Approval

1. Invoice is created  
2. Line items are added  
3. Invoice is submitted for review  
4. AI generates routing recommendation  
5. Operator reviews suggestion  
6. Approval flow is created explicitly  
7. Approval decisions update invoice  
8. WorkflowRun records lifecycle  

---

## Example End-to-End Flow

1. Communication thread is created  
2. Case is created from the communication  
3. AI suggests case categorization and priority  
4. Operator applies recommendation  
5. Work order is created  
6. Vendor is assigned  
7. Workflow visibility captures execution  

---

## Repository Structure

apps/api  
apps/web  
packages/*  
infra/docker  
docs/*  

---

## Local Setup

pnpm install  
docker compose -f infra/docker/docker-compose.yml up -d  
pnpm db:migrate  
pnpm db:seed  
pnpm dev  

Optional:

cp .env.example .env  

Seeded admin:  
email: admin@vivanta.local  
password: ChangeMe123!  

---

## Implemented vs Deferred

### Implemented

- full domain model  
- workflow visibility layer  
- invoice + approval backbone  
- document ingestion backbone  
- communications + cases system  
- AI foundation + integrations  
- AI observability + evaluation  

### Deferred

- real LLM provider integration  
- OCR / document parsing  
- Temporal workflow execution  
- notifications  
- accounting integrations  
- full frontend UI  

---

## Tradeoffs and Decisions

- Modular monolith vs microservices  
  faster iteration, simpler transactions  

- Workflow visibility before orchestration  
  observability first, execution later  

- AI as assistive layer  
  preserves auditability and operator control  

- Provider abstraction  
  prevents vendor lock-in  

- Explicit application model  
  AI never mutates state without human intent  

---

## Future Direction

- selective migration of workflows to Temporal execution  
- real AI providers (LLMs, OCR, extraction)  
- predictive maintenance and vendor optimization  
- operator-facing UI and dashboards  
- external integrations (accounting, messaging, payments)  

---

## Summary

This repository represents a workflow-driven operations platform foundation with:

- strong domain modeling  
- auditable workflows  
- controlled AI assistance  
- scalable architecture  

It is designed to evolve into a full system of action without requiring a rewrite of core logic.

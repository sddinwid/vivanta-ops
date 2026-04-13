# Vivanta Operations OS

> Designed as a foundation for AI-driven property operations and scalable workflow automation.

![Status](https://img.shields.io/badge/status-in%20progress-blue)

AI-assisted property operations platform designed to reduce manual workload across document handling, invoice operations, communications, approvals, and case management.

Built as an internal system of action for property management, with a clear path toward scalable platformization.

---

## Why this exists

Property management is operationally dense, fragmented, and still heavily manual. Critical workflows such as document handling, invoice approvals, communications, and maintenance coordination are often spread across disconnected systems.

Vivanta Operations OS is designed to consolidate these workflows into a single operational backbone, where structured data, durable workflows, and AI assistance work together to improve efficiency, consistency, and visibility.

---

## Product Principles

- **Operator-first, platform-ready**  
  Designed for real operational use from day one, not as a generic SaaS dashboard  

- **Workflow-centric, not screen-centric**  
  Core logic is driven by durable workflows, not UI interactions  

- **AI-assisted, not AI-dependent**  
  AI augments decision-making, but accountability remains explicit and auditable  

- **Auditability before autonomy**  
  Every critical action is traceable and reviewable  

- **Modular architecture for long-term scale**  
  Built as a modular monolith with clear domain boundaries  

---

## V1 Focus (Operational Wedge)

The first version targets high-leverage operational workflows:

- Document intake and classification  
- Invoice extraction and approval workflows  
- Communications triage and routing  
- Operational case and maintenance management  

These workflows create immediate business value while establishing the core system primitives for long-term expansion.

---

## 🧩 System Architecture

```mermaid
flowchart TD

    UI[Next.js / React UI] --> API[NestJS API Layer]

    API --> DB[(PostgreSQL)]
    API --> CACHE[(Redis)]
    API --> STORAGE[(S3 Object Storage)]

    API --> WORKFLOWS[Temporal Workflows]

    WORKFLOWS --> AI[AI Orchestration Layer]
    AI --> LLM[LLM APIs]
    AI --> EMBEDDINGS[Embedding / RAG Pipelines]

    WORKFLOWS --> EXT[External Integrations]
    EXT --> ERP[ERP / Accounting Systems]
    EXT --> EMAIL[Email Providers]

    WORKFLOWS --> USERS[Human-in-the-loop Approval]

---

## Architecture Overview

**Frontend**
- Next.js  
- React  
- TypeScript  

**Backend**
- NestJS  
- Modular architecture  

**Data Layer**
- PostgreSQL  

**Workflow Orchestration**
- Temporal  

**Infrastructure**
- Redis  
- S3-compatible storage  

**AI Layer**
- LLM integrations  
- RAG pipelines  
- Embedding systems  
- Python workers (optional)  

---

## Architectural Approach

The system is designed as a **modular monolith backed by durable workflows**.

This approach:
- enables fast iteration in early-stage development  
- maintains strong domain boundaries  
- reduces operational overhead compared to microservices  
- allows clean evolution into services when needed  

AI is implemented as an **orchestration layer**, not core business logic, ensuring reliability and auditability.

---

## Core Workflows

### Document Intake and Classification
- Documents enter via upload, email, or integration  
- Stored with metadata  
- OCR and extraction pipelines process content  
- AI classifies document type  
- Routed automatically or sent for human review  

---

### Invoice Extraction and Approval
- Documents identified as invoices  
- Key data extracted (vendor, amount, dates)  
- Duplicate detection applied  
- Approval workflow triggered  
- Human review ensures correctness  
- Export to accounting systems  

---

### Communication Triage
- Messages ingested from email or portal  
- Threads created or updated  
- AI classifies urgency and topic  
- Routing suggested or automated  
- Follow-up tasks generated  

---

### Case and Maintenance Operations
- Issues create cases linked to properties  
- Vendors assigned based on rules  
- Work orders issued  
- SLA timers track progress  
- Status updates propagate to stakeholders  

---

## Example Workflow (Conceptual)

### Invoice Processing Flow

1. Invoice received via email or upload  
2. Document stored and processed  
3. AI extracts structured fields  
4. Validation and duplicate detection applied  
5. Approval workflow triggered  
6. Human reviewer confirms or edits  
7. Approved invoice exported  
8. Full audit trail recorded  

---

## Core Domain Model

Key entities:

- Property, Building, Unit  
- Owner, Tenant, Vendor  
- Document, Invoice, ApprovalFlow  
- CommunicationThread, Message  
- Case, WorkOrder, Task  
- WorkflowRun, AuditEvent  

---

## System of Record Strategy

Vivanta Operations OS owns operational truth:

- documents  
- communications  
- workflows  
- approvals  
- audit logs  

External systems handle:
- accounting  
- payments  
- regulatory reporting  

---

## Repository Structure
```text
vivanta-ops/

  apps/
    api/
    web/
    worker-ai/

  packages/
    domain/
    ui/
    config/
    observability/

  infra/
    docker/
    terraform/

  docs/
    architecture/
    workflows/
    adr/

  scripts/

## Current Status

- Monorepo initialized  
- Backend and frontend scaffolding  
- PostgreSQL integration  
- Initial architecture defined  

---

## Next Steps

- Authentication and RBAC  
- Core domain implementation  
- Document ingestion pipeline  
- Invoice workflows  
- Temporal integration  
- AI services integration  

---

## Future Direction

- Predictive maintenance models  
- Automated communication workflows  
- Vendor coordination optimization  
- Increased workflow automation  

---

## Summary

Vivanta Operations OS is designed to become the **system of action** for property management.

It combines structured data, durable workflows, and AI-assisted decision-making to reduce manual effort and enable scalable operations.

---

## Author

Scott Dinwiddie  
Berlin, Germany  

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

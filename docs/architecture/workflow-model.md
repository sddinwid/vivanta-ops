# Workflow Model Architecture

## Overview

The workflow model in Vivanta Operations OS is designed to provide **visibility-first orchestration** across operational domains (documents, communications, cases, tasks, work orders, invoices, approvals) without tightly coupling execution to a workflow engine.

The system separates:
- **domain state transitions** (deterministic, transactional)
- **workflow visibility and control** (observable, replayable)

This allows the platform to evolve from a modular monolith into a workflow-driven system without rewriting core logic.

---

## Core Concepts

### 1. System of Record vs System of Action

- **System of Record**: domain modules (documents, invoices, cases, etc.) own truth and enforce invariants.
- **System of Action**: workflows coordinate and visualize cross-module processes.

Workflows never replace domain truth.

---

### 2. WorkflowRun

Represents a single execution instance of a workflow.

Key fields:
- workflowType
- targetEntityType
- targetEntityId
- status (running, completed, failed, cancelled)
- startedAt / finishedAt
- correlationId (optional)

A WorkflowRun is created when a domain event occurs (e.g., case created, invoice submitted).

---

### 3. WorkflowEvent

Represents discrete steps or transitions within a workflow.

Examples:
- "case.created"
- "work_order.assigned"
- "invoice.submitted_for_review"
- "approval.step.completed"

Properties:
- workflowRunId
- eventType
- payloadJson
- createdAt

Events provide a **timeline of execution** for debugging and observability.

---

### 4. Orchestration Facade

The system uses a **facade pattern** to abstract workflow execution.

```text
WorkflowFacadeService
  -> (stub implementation)
  -> (future Temporal implementation)
```

Responsibilities:
- start workflows
- append events
- cancel / retry runs
- isolate orchestration logic from domain modules

Current state:
- stubbed (visibility only)
- non-blocking
- no hard dependency on Temporal runtime

---

## Execution Model

### General Flow

```text
Domain Action
  -> Domain Service completes transaction
  -> WorkflowFacadeService.start()
  -> WorkflowRun created
  -> WorkflowEvent(s) appended
```

Important:

- workflow creation is **best-effort**
- domain success is **never dependent on workflow success**
- failures in workflow creation do not rollback domain actions

---

## Domain Integration Patterns

### 1. Event-driven (non-invasive)

Domain modules emit workflow triggers after successful operations.

Examples:

- Case creation -> start `case_lifecycle`
- Invoice submit -> start `invoice_processing`
- Document upload -> start `document_ingestion`

---

### 2. Append-only lifecycle tracking

Domain modules append workflow events at key transitions.

Example:

```text
Case created
  -> WorkflowEvent: case.created

Work order created
  -> WorkflowEvent: work_order.created

Vendor assigned
  -> WorkflowEvent: work_order.assigned
```

---

### 3. Idempotent operations

Workflow interactions must be safe to retry.

- duplicate events should not break flows
- retrying a workflow should not corrupt domain state

---

## Workflow Types (Examples)

### Case Lifecycle

- case.created
- case.assigned
- case.in_progress
- work_order.created
- work_order.completed
- case.closed

---

### Invoice Processing

- invoice.created
- invoice.submitted_for_review
- invoice.submitted_for_approval
- approval.step.completed
- invoice.approved
- invoice.exported

---

### Communication Triage

- thread.created
- message.received
- ai.triage.suggested
- case.created (optional)
- assignment.performed

---

### Document Ingestion

- document.uploaded
- ai.classification_run
- ai.extraction_run
- document.processed

---

## Control Endpoints

Workflow endpoints allow visibility and control:

- GET /api/v1/workflows/runs
- GET /api/v1/workflows/runs/:id
- GET /api/v1/workflows/runs/:id/events
- POST /api/v1/workflows/runs/:id/cancel
- POST /api/v1/workflows/runs/:id/retry

These endpoints do not directly mutate domain entities.

---

## Design Principles

### 1. Visibility before orchestration

The system captures workflow state before enforcing execution logic.

This ensures:
- observability
- debuggability
- safe iteration

---

### 2. Non-blocking integration

Workflows do not block domain logic.

- domain operations succeed independently
- workflows are additive

---

### 3. Loose coupling

Domain modules do not depend on workflow engine implementation.

- communication via facade
- no direct Temporal coupling

---

### 4. Incremental migration path

The architecture allows:

- current: visibility-only workflows
- future: selected flows executed in Temporal

without breaking existing modules

---

## Temporal Integration (Future)

The facade allows replacing the stub with Temporal:

```text
WorkflowFacadeService
  -> TemporalWorkflowFacadeService
       -> startWorkflow()
       -> signalWorkflow()
       -> queryWorkflow()
```

Migration strategy:

- move specific workflows first (e.g., invoice processing)
- keep domain services unchanged
- shift orchestration logic gradually

---

## Safety Model

- workflows never override domain state
- cancellation does not roll back domain changes
- retries must be explicit
- all actions are auditable

---

## Tradeoffs

### Chosen

- visibility-first approach
- facade abstraction
- append-only event model
- non-blocking workflow execution

### Deferred

- full Temporal runtime execution
- distributed sagas
- compensation logic
- cross-service orchestration

---

## Future Evolution

- move critical workflows to Temporal execution
- add step-level retries and backoff
- introduce workflow-level SLAs
- integrate AI-driven workflow decisions
- add operator dashboards for workflow control

---

## Summary

The workflow model provides:

- clear separation between domain logic and orchestration
- full visibility into process execution
- safe integration points for automation and AI
- a path to scalable workflow execution without rewriting core systems

It is designed to evolve from a visibility layer into a fully orchestrated system of action.

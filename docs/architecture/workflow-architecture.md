# Workflow Architecture

## Current Model

Vivanta uses a **facade-first orchestration model**:

- Domain modules perform local business state changes directly.
- Modules create `WorkflowRun` + `WorkflowEvent` records for visibility.
- A Temporal boundary exists behind `temporal-workflow-facade.service.ts`.
- Provider is currently stub-capable (`TEMPORAL_STUB`) and can switch to Temporal-backed behavior incrementally.

## Why This Approach

- keeps business logic simple while workflows are still evolving
- gives immediate observability into process lifecycles
- preserves an upgrade path to true long-running orchestration

## Current Workflow Types

- `document_ingestion`
- `invoice_processing`
- `approval_flow`
- `communication_triage`
- `case_lifecycle`

## Current Status Semantics

- `RUNNING`
- `WAITING`
- `COMPLETED`
- `FAILED`
- `CANCELLED`

## Control Endpoints

- list workflow runs
- workflow run detail
- workflow events
- retry request (local state control for now)
- cancel request (local state control for now)

## Future Path (Planned)

1. Keep writing workflow run/event records for observability continuity.
2. Introduce selected Temporal workflows with minimal surface area.
3. Shift specific long-running processes to Temporal execution.
4. Keep domain modules as source of truth; orchestration coordinates, it does not own core domain data.

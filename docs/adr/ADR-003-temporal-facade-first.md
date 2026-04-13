# ADR-003: Temporal Facade First

- Status: Accepted
- Date: 2026-04-13

## Context

Operational workflows are evolving quickly. Full migration to Temporal execution now would slow delivery and create premature orchestration complexity.

## Decision

Introduce a workflow facade boundary with local workflow visibility records (`WorkflowRun`, `WorkflowEvent`) and stub-capable orchestration provider support.

## Consequences

- Positive: immediate process visibility and observability.
- Positive: clear seam for future Temporal adoption.
- Positive: domain modules remain simple while behavior stabilizes.
- Tradeoff: current retry/cancel are local-state controls, not full replay execution.

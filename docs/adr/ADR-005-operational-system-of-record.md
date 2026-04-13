# ADR-005: Operational System of Record

- Status: Accepted
- Date: 2026-04-13

## Context

Vivanta is intended to coordinate day-to-day property operations. Reliability, traceability, and role-based control are higher priorities than early automation breadth.

## Decision

Treat Vivanta API + Postgres domain models as the operational system of record. Keep AI and external integrations as additive capabilities behind explicit module boundaries.

## Consequences

- Positive: deterministic operational behavior and auditable state transitions.
- Positive: clear foundation for compliance and accountability.
- Positive: integrations can be introduced without redefining core ownership of data.
- Tradeoff: some advanced automation remains intentionally deferred.

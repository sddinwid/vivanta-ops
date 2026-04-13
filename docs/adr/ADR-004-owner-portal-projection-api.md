# ADR-004: Owner Portal Projection API

- Status: Accepted
- Date: 2026-04-13

## Context

Owner-facing views require strict data minimization and ownership scoping. Reusing internal APIs directly risks leaking internal operational fields and access semantics.

## Decision

Build dedicated portal projection endpoints with centralized access checks via `PortalAccessService`. Owner scope is resolved by `User.ownerId -> Owner -> PropertyOwnerLink`.

## Consequences

- Positive: safer owner-visible API surface.
- Positive: clear separation between internal operations APIs and externalized owner projections.
- Positive: easier future evolution of owner-specific UX contracts.
- Tradeoff: additional projection/repository code to maintain.

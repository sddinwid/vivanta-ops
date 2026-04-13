# ADR-001: Modular Monolith

- Status: Accepted
- Date: 2026-04-13

## Context

Vivanta needs fast iteration across tightly related operational workflows (documents, communications, cases, work orders, invoices, approvals). Early microservice decomposition would add significant operational and consistency overhead.

## Decision

Use a NestJS modular monolith with explicit module boundaries and shared platform foundations (auth, access, audit, workflows, portal projections).

## Consequences

- Positive: strong transactional consistency and faster product iteration.
- Positive: simpler deployment and local development.
- Tradeoff: requires discipline around module boundaries to avoid coupling.
- Tradeoff: future extraction to services remains possible but is deferred.

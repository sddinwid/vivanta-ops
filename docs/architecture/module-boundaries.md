# Module Boundaries

## Boundary Philosophy

Each module owns:
- controller/API surface
- DTO validation
- service-level rules
- repository access patterns
- response mapping

Cross-module coordination is done through service calls, not direct controller reuse.

## Foundation Modules

- `auth`: login/me and JWT issuance
- `access`: roles, permissions, effective access resolution
- `audit`: append-only state-change event logging
- `workflows`: workflow run/event visibility and control operations
- `portal`: owner-safe projection endpoints

## Operational Modules

- `properties`: properties, buildings, units
- `owners`
- `vendors`
- `documents`
- `communications`
- `cases`
- `tasks`
- `work-orders`
- `invoices`
- `approvals`

## Dependency Direction (Current)

- Feature modules -> shared foundation (`audit`, `workflows`) where relevant
- Feature modules -> Prisma repositories local to module
- `portal` depends on read projections and dedicated access checks, not internal controllers

## What Is Deliberately Avoided

- Cross-cutting generic abstraction layers that hide domain rules
- Microservice splits before bounded contexts stabilize
- Reusing internal write endpoints for portal read paths

## Workflow Boundary

Workflow records represent orchestration state and event traces. They should not replace module-specific source-of-truth states (case status, invoice approval status, etc.).

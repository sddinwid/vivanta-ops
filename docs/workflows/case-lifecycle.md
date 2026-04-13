# Case Lifecycle

## Current Backbone (Implemented)

Cases module supports:
- create/read/update
- assignment
- status transitions
- queue views (open, escalated, waiting)

Workflow visibility hook on case create:
- `WorkflowRun` with `workflowType=case_lifecycle`
- initial event `case_opened`

## What Is Local State Today

- Case status and owner-visible status fields
- assignment checks and organization scoping
- related work-order linkage through existing work-order module

## Future Orchestration Path

Potential Temporal-managed capabilities (deferred):
- SLA timing and breach events
- multi-step remediation sequences
- cross-module orchestration with communications/approvals

Current implementation keeps lifecycle as direct domain state transitions.

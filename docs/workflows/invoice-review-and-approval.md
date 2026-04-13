# Invoice Review and Approval

## Current Backbone (Implemented)

Invoice flow currently supports:
- draft/update
- submit for review
- submit for approval
- approval flow + steps
- approve/reject/request changes
- export status update (local state only)

Workflow visibility hook on submit-for-approval:
- `WorkflowRun` with `workflowType=invoice_processing`
- initial event `invoice_submitted_for_approval`

Approval-flow creation also emits workflow visibility:
- `workflowType=approval_flow`
- event `approval_flow_started`

## What Is Local State Today

- Invoice status transitions and validation rules
- Approval step progression and decisions
- Export request state only (no external accounting integration)

## Future Orchestration Path

Potential Temporal-managed extensions (deferred):
- asynchronous approval escalation rules
- SLA timers and reminders
- integration handoff to accounting systems

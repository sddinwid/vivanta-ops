# Communication Triage

## Current Backbone (Implemented)

Communications module supports:
- thread creation/update
- assignment/linking
- message creation with optional document attachments
- queue views (inbox, unassigned, urgent)

Workflow visibility hook on thread creation:
- `WorkflowRun` with `workflowType=communication_triage`
- initial event `thread_created`

## What Is Local State Today

- Thread/message persistence
- assignment and linking validation
- queue derivation from thread state

## Future Orchestration Path

Potential Temporal-managed capabilities (deferred):
- inbound triage classification
- intelligent routing and prioritization
- escalation and follow-up timers

No outbound delivery or AI-generated replies are implemented yet.

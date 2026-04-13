# Document Ingestion

## Current Backbone (Implemented)

Trigger point:
- Document upload success in `documents` module.

Current behavior:
- File metadata stored in `Document`
- Optional `DocumentLink`/`Attachment` records
- Ingestion status initialized (`UPLOADED`/reprocess states)
- Workflow visibility hook creates:
  - `WorkflowRun` (`workflowType=document_ingestion`)
  - initial `WorkflowEvent` (`document_uploaded`)

## What Is Local State Today

- Upload persistence and document metadata
- Linking validation and organization scoping
- Reprocess request updates ingestion status locally

## Future Orchestration Path

Potential Temporal-managed steps (deferred):
- extraction pipeline dispatch
- classification/routing
- downstream task creation

The facade + run/event records are already in place to support this transition.

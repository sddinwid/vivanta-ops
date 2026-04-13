export const WORKFLOW_TYPES = {
  DOCUMENT_INGESTION: "document_ingestion",
  INVOICE_PROCESSING: "invoice_processing",
  APPROVAL_FLOW: "approval_flow",
  COMMUNICATION_TRIAGE: "communication_triage",
  CASE_LIFECYCLE: "case_lifecycle"
} as const;

export type WorkflowType = (typeof WORKFLOW_TYPES)[keyof typeof WORKFLOW_TYPES];

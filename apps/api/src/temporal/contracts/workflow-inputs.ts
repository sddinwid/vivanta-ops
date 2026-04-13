import { WorkflowType } from "../workflow-types";

export interface WorkflowStartInput {
  organizationId: string;
  workflowType: WorkflowType | string;
  targetEntityType?: string;
  targetEntityId?: string;
  metadata?: Record<string, unknown>;
}

export interface DocumentIngestionWorkflowInput extends WorkflowStartInput {
  workflowType: "document_ingestion";
  targetEntityType: "Document";
  targetEntityId: string;
}

export interface InvoiceProcessingWorkflowInput extends WorkflowStartInput {
  workflowType: "invoice_processing";
  targetEntityType: "Invoice";
  targetEntityId: string;
}

export interface ApprovalFlowWorkflowInput extends WorkflowStartInput {
  workflowType: "approval_flow";
  targetEntityType: "ApprovalFlow";
  targetEntityId: string;
}

export interface CommunicationTriageWorkflowInput extends WorkflowStartInput {
  workflowType: "communication_triage";
  targetEntityType: "CommunicationThread";
  targetEntityId: string;
}

export interface CaseLifecycleWorkflowInput extends WorkflowStartInput {
  workflowType: "case_lifecycle";
  targetEntityType: "Case";
  targetEntityId: string;
}

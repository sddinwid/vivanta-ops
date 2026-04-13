import { WorkflowOrchestrationProvider } from "@prisma/client";
import { WorkflowStartInput } from "./contracts/workflow-inputs";

export interface WorkflowStartResult {
  provider: WorkflowOrchestrationProvider;
  orchestrationRunId: string | null;
}

export interface WorkflowControlResult {
  accepted: boolean;
}

export interface WorkflowFacade {
  startWorkflow(input: WorkflowStartInput): Promise<WorkflowStartResult>;
  retryWorkflow(orchestrationRunId?: string | null): Promise<WorkflowControlResult>;
  cancelWorkflow(orchestrationRunId?: string | null): Promise<WorkflowControlResult>;
}

import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { WorkflowOrchestrationProvider } from "@prisma/client";
import {
  WorkflowControlResult,
  WorkflowFacade,
  WorkflowStartResult
} from "./workflow-facade.interface";
import { WorkflowStartInput } from "./contracts/workflow-inputs";

@Injectable()
export class TemporalWorkflowFacadeService implements WorkflowFacade {
  constructor(private readonly configService: ConfigService) {}

  async startWorkflow(input: WorkflowStartInput): Promise<WorkflowStartResult> {
    const temporalEnabled = this.configService.get<string>("TEMPORAL_ENABLED") === "true";
    if (temporalEnabled) {
      const orchestrationRunId = `temporal-${input.workflowType}-${Date.now()}`;
      return {
        provider: WorkflowOrchestrationProvider.TEMPORAL,
        orchestrationRunId
      };
    }

    return {
      provider: WorkflowOrchestrationProvider.TEMPORAL_STUB,
      orchestrationRunId: `stub-${input.workflowType}-${Date.now()}`
    };
  }

  async retryWorkflow(): Promise<WorkflowControlResult> {
    return { accepted: true };
  }

  async cancelWorkflow(): Promise<WorkflowControlResult> {
    return { accepted: true };
  }
}

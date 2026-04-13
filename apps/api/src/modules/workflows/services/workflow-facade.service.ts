import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Prisma, WorkflowStatus } from "@prisma/client";
import { TemporalWorkflowFacadeService } from "../../../temporal/temporal-workflow-facade.service";
import { WORKFLOW_TYPES } from "../../../temporal/workflow-types";
import { WorkflowEventsRepository } from "../repositories/workflow-events.repository";
import { WorkflowsRepository } from "../repositories/workflows.repository";

@Injectable()
export class WorkflowFacadeService {
  private readonly logger = new Logger(WorkflowFacadeService.name);

  constructor(
    private readonly workflowsRepository: WorkflowsRepository,
    private readonly workflowEventsRepository: WorkflowEventsRepository,
    private readonly temporalWorkflowFacadeService: TemporalWorkflowFacadeService
  ) {}

  startDocumentIngestionWorkflow(params: {
    organizationId: string;
    documentId: string;
    actorUserId?: string;
    requestId?: string;
  }) {
    return this.startWorkflowRun({
      organizationId: params.organizationId,
      workflowType: WORKFLOW_TYPES.DOCUMENT_INGESTION,
      targetEntityType: "Document",
      targetEntityId: params.documentId,
      initialEventType: "document_uploaded",
      initialEventPayload: {
        ...(params.actorUserId ? { actorUserId: params.actorUserId } : {}),
        ...(params.requestId ? { requestId: params.requestId } : {})
      }
    });
  }

  startInvoiceProcessingWorkflow(params: {
    organizationId: string;
    invoiceId: string;
    actorUserId?: string;
    requestId?: string;
  }) {
    return this.startWorkflowRun({
      organizationId: params.organizationId,
      workflowType: WORKFLOW_TYPES.INVOICE_PROCESSING,
      targetEntityType: "Invoice",
      targetEntityId: params.invoiceId,
      initialEventType: "invoice_submitted_for_approval",
      initialEventPayload: {
        ...(params.actorUserId ? { actorUserId: params.actorUserId } : {}),
        ...(params.requestId ? { requestId: params.requestId } : {})
      }
    });
  }

  startApprovalFlowWorkflow(params: {
    organizationId: string;
    approvalFlowId: string;
    actorUserId?: string;
    requestId?: string;
  }) {
    return this.startWorkflowRun({
      organizationId: params.organizationId,
      workflowType: WORKFLOW_TYPES.APPROVAL_FLOW,
      targetEntityType: "ApprovalFlow",
      targetEntityId: params.approvalFlowId,
      initialEventType: "approval_flow_started",
      initialEventPayload: {
        ...(params.actorUserId ? { actorUserId: params.actorUserId } : {}),
        ...(params.requestId ? { requestId: params.requestId } : {})
      }
    });
  }

  startCommunicationTriageWorkflow(params: {
    organizationId: string;
    communicationThreadId: string;
    actorUserId?: string;
    requestId?: string;
  }) {
    return this.startWorkflowRun({
      organizationId: params.organizationId,
      workflowType: WORKFLOW_TYPES.COMMUNICATION_TRIAGE,
      targetEntityType: "CommunicationThread",
      targetEntityId: params.communicationThreadId,
      initialEventType: "thread_created",
      initialEventPayload: {
        ...(params.actorUserId ? { actorUserId: params.actorUserId } : {}),
        ...(params.requestId ? { requestId: params.requestId } : {})
      }
    });
  }

  startCaseLifecycleWorkflow(params: {
    organizationId: string;
    caseId: string;
    actorUserId?: string;
    requestId?: string;
  }) {
    return this.startWorkflowRun({
      organizationId: params.organizationId,
      workflowType: WORKFLOW_TYPES.CASE_LIFECYCLE,
      targetEntityType: "Case",
      targetEntityId: params.caseId,
      initialEventType: "case_opened",
      initialEventPayload: {
        ...(params.actorUserId ? { actorUserId: params.actorUserId } : {}),
        ...(params.requestId ? { requestId: params.requestId } : {})
      }
    });
  }

  async appendEvent(params: {
    organizationId: string;
    workflowRunId: string;
    eventType: string;
    eventPayload?: Prisma.JsonValue;
  }) {
    const run = await this.requireScopedRun(params.organizationId, params.workflowRunId);
    return this.workflowEventsRepository.create({
      workflowRun: { connect: { id: run.id } },
      eventType: params.eventType,
      eventPayload: params.eventPayload
    });
  }

  async heartbeat(organizationId: string, workflowRunId: string) {
    await this.requireScopedRun(organizationId, workflowRunId);
    return this.workflowsRepository.update(workflowRunId, {
      lastHeartbeatAt: new Date()
    });
  }

  async markRunCompleted(organizationId: string, workflowRunId: string) {
    await this.requireScopedRun(organizationId, workflowRunId);
    return this.workflowsRepository.update(workflowRunId, {
      status: WorkflowStatus.COMPLETED,
      completedAt: new Date()
    });
  }

  async markRunFailed(organizationId: string, workflowRunId: string, reason?: string) {
    await this.requireScopedRun(organizationId, workflowRunId);
    const updated = await this.workflowsRepository.update(workflowRunId, {
      status: WorkflowStatus.FAILED,
      completedAt: new Date()
    });
    await this.workflowEventsRepository.create({
      workflowRun: { connect: { id: workflowRunId } },
      eventType: "workflow_failed",
      eventPayload: reason ? { reason } : undefined
    });
    return updated;
  }

  async retryRun(organizationId: string, workflowRunId: string, reason?: string) {
    const existing = await this.requireScopedRun(organizationId, workflowRunId);
    if (![WorkflowStatus.FAILED, WorkflowStatus.CANCELLED].includes(existing.status)) {
      throw new BadRequestException("Retry is only allowed for failed or cancelled runs");
    }

    await this.temporalWorkflowFacadeService.retryWorkflow(existing.orchestrationRunId);
    const updated = await this.workflowsRepository.update(workflowRunId, {
      status: WorkflowStatus.RUNNING,
      startedAt: new Date(),
      completedAt: null
    });
    await this.workflowEventsRepository.create({
      workflowRun: { connect: { id: workflowRunId } },
      eventType: "workflow_retry_requested",
      eventPayload: reason ? { reason } : undefined
    });
    return updated;
  }

  async cancelRun(organizationId: string, workflowRunId: string, reason?: string) {
    const existing = await this.requireScopedRun(organizationId, workflowRunId);
    if (existing.status === WorkflowStatus.COMPLETED) {
      throw new BadRequestException("Cannot cancel a completed workflow run");
    }
    if (existing.status === WorkflowStatus.CANCELLED) {
      throw new BadRequestException("Workflow run is already cancelled");
    }

    await this.temporalWorkflowFacadeService.cancelWorkflow(existing.orchestrationRunId);
    const updated = await this.workflowsRepository.update(workflowRunId, {
      status: WorkflowStatus.CANCELLED,
      completedAt: new Date()
    });
    await this.workflowEventsRepository.create({
      workflowRun: { connect: { id: workflowRunId } },
      eventType: "workflow_cancel_requested",
      eventPayload: reason ? { reason } : undefined
    });
    return updated;
  }

  async startWorkflowRun(params: {
    organizationId: string;
    workflowType: string;
    targetEntityType?: string;
    targetEntityId?: string;
    initialEventType: string;
    initialEventPayload?: Prisma.JsonValue;
  }) {
    const orchestration = await this.temporalWorkflowFacadeService.startWorkflow({
      organizationId: params.organizationId,
      workflowType: params.workflowType,
      targetEntityType: params.targetEntityType,
      targetEntityId: params.targetEntityId
    });
    const run = await this.workflowsRepository.create({
      organization: { connect: { id: params.organizationId } },
      workflowType: params.workflowType,
      targetEntityType: params.targetEntityType,
      targetEntityId: params.targetEntityId,
      orchestrationProvider: orchestration.provider,
      orchestrationRunId: orchestration.orchestrationRunId,
      status: WorkflowStatus.RUNNING
    });
    await this.workflowEventsRepository.create({
      workflowRun: { connect: { id: run.id } },
      eventType: params.initialEventType,
      eventPayload: params.initialEventPayload
    });
    return run;
  }

  async startWorkflowRunSafe(params: {
    organizationId: string;
    workflowType: string;
    targetEntityType?: string;
    targetEntityId?: string;
    initialEventType: string;
    initialEventPayload?: Prisma.JsonValue;
  }): Promise<void> {
    try {
      await this.startWorkflowRun(params);
    } catch (error) {
      this.logger.error(
        `Workflow run creation failed for type=${params.workflowType} target=${params.targetEntityType ?? "n/a"}:${params.targetEntityId ?? "n/a"}`,
        error instanceof Error ? error.stack : undefined
      );
    }
  }

  private async requireScopedRun(organizationId: string, workflowRunId: string) {
    const run = await this.workflowsRepository.findByIdScoped(workflowRunId, organizationId);
    if (!run) {
      throw new NotFoundException("Workflow run not found");
    }
    return run;
  }
}

import { Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "../../audit/services/audit.service";
import { CancelWorkflowDto } from "../dto/cancel-workflow.dto";
import { RetryWorkflowDto } from "../dto/retry-workflow.dto";
import { WorkflowFiltersDto } from "../dto/workflow-filters.dto";
import { WorkflowMapper } from "../mappers/workflow.mapper";
import { WorkflowEventsRepository } from "../repositories/workflow-events.repository";
import { WorkflowsRepository } from "../repositories/workflows.repository";
import { WorkflowFacadeService } from "./workflow-facade.service";

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly workflowsRepository: WorkflowsRepository,
    private readonly workflowEventsRepository: WorkflowEventsRepository,
    private readonly workflowFacadeService: WorkflowFacadeService,
    private readonly auditService: AuditService
  ) {}

  async listRuns(organizationId: string, filters: WorkflowFiltersDto) {
    const [runs, total] = await Promise.all([
      this.workflowsRepository.listByOrganization(organizationId, filters),
      this.workflowsRepository.countByOrganization(organizationId, filters)
    ]);

    return {
      data: runs.map(WorkflowMapper.runToResponse),
      meta: {
        total,
        limit: filters.limit ?? 25,
        offset: filters.offset ?? 0
      }
    };
  }

  async getRunById(organizationId: string, workflowRunId: string) {
    const run = await this.workflowsRepository.findByIdScoped(workflowRunId, organizationId);
    if (!run) {
      throw new NotFoundException("Workflow run not found");
    }
    return WorkflowMapper.runToResponse(run);
  }

  async listRunEvents(organizationId: string, workflowRunId: string) {
    const run = await this.workflowsRepository.findByIdScoped(workflowRunId, organizationId);
    if (!run) {
      throw new NotFoundException("Workflow run not found");
    }
    const events = await this.workflowEventsRepository.listByWorkflowRun(workflowRunId);
    return {
      data: events.map(WorkflowMapper.eventToResponse),
      meta: { total: events.length }
    };
  }

  async retryRun(params: {
    organizationId: string;
    actorUserId: string;
    workflowRunId: string;
    dto: RetryWorkflowDto;
    requestId?: string;
  }) {
    const updated = await this.workflowFacadeService.retryRun(
      params.organizationId,
      params.workflowRunId,
      params.dto.reason
    );
    await this.auditService.record({
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      actionType: "workflow.retry_requested",
      entityType: "WorkflowRun",
      entityId: params.workflowRunId,
      newValues: WorkflowMapper.runToResponse(updated),
      metadata: { requestId: params.requestId, reason: params.dto.reason }
    });
    return WorkflowMapper.runToResponse(updated);
  }

  async cancelRun(params: {
    organizationId: string;
    actorUserId: string;
    workflowRunId: string;
    dto: CancelWorkflowDto;
    requestId?: string;
  }) {
    const updated = await this.workflowFacadeService.cancelRun(
      params.organizationId,
      params.workflowRunId,
      params.dto.reason
    );
    await this.auditService.record({
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      actionType: "workflow.cancel_requested",
      entityType: "WorkflowRun",
      entityId: params.workflowRunId,
      newValues: WorkflowMapper.runToResponse(updated),
      metadata: { requestId: params.requestId, reason: params.dto.reason }
    });
    return WorkflowMapper.runToResponse(updated);
  }
}

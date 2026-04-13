import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  ApprovalDecision,
  ApprovalFlowStatus,
  ApprovalStepStatus,
  ApprovalTargetEntityType,
  InvoiceApprovalStatus
} from "@prisma/client";
import { AuditService } from "../../audit/services/audit.service";
import { ApprovalDecisionDto } from "../dto/approval-decision.dto";
import { ApprovalFiltersDto } from "../dto/approval-filters.dto";
import { CreateApprovalFlowDto } from "../dto/create-approval-flow.dto";
import { ApprovalMapper } from "../mappers/approval.mapper";
import { ApprovalStepsRepository } from "../repositories/approval-steps.repository";
import { ApprovalsRepository } from "../repositories/approvals.repository";

@Injectable()
export class ApprovalsService {
  constructor(
    private readonly approvalsRepository: ApprovalsRepository,
    private readonly approvalStepsRepository: ApprovalStepsRepository,
    private readonly auditService: AuditService
  ) {}

  async list(organizationId: string, filters: ApprovalFiltersDto) {
    const [flows, total] = await Promise.all([
      this.approvalsRepository.listByOrganization(organizationId, filters),
      this.approvalsRepository.countByOrganization(organizationId, filters)
    ]);
    return {
      data: flows.map(ApprovalMapper.flowToResponse),
      meta: { total, limit: filters.limit ?? 25, offset: filters.offset ?? 0 }
    };
  }

  async getById(organizationId: string, flowId: string) {
    const flow = await this.requireFlow(flowId, organizationId);
    return ApprovalMapper.flowToResponse(flow);
  }

  async getSteps(organizationId: string, flowId: string) {
    await this.requireFlow(flowId, organizationId);
    const steps = await this.approvalStepsRepository.listByFlow(flowId);
    return { data: steps, meta: { total: steps.length } };
  }

  async createFlow(params: {
    organizationId: string;
    actorUserId: string;
    dto: CreateApprovalFlowDto;
    requestId?: string;
  }) {
    const { organizationId, actorUserId, dto, requestId } = params;
    await this.validateTargetEntity(organizationId, dto.targetEntityType, dto.targetEntityId);

    const approverUserIds = dto.approverUserIds ?? [];
    const flow = await this.approvalsRepository.create({
      organization: { connect: { id: organizationId } },
      targetEntityType: dto.targetEntityType,
      targetEntityId: dto.targetEntityId,
      flowType: dto.flowType,
      initiatedByUser: { connect: { id: actorUserId } }
    });

    await this.approvalStepsRepository.createMany(
      approverUserIds.map((approverUserId, index) => ({
        approvalFlowId: flow.id,
        stepOrder: index + 1,
        approverUserId
      }))
    );

    const withSteps = await this.requireFlow(flow.id, organizationId);
    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "approval.flow.create",
      entityType: "ApprovalFlow",
      entityId: flow.id,
      newValues: ApprovalMapper.flowToResponse(withSteps),
      metadata: { requestId }
    });
    return ApprovalMapper.flowToResponse(withSteps);
  }

  async approve(
    organizationId: string,
    actorUserId: string,
    flowId: string,
    dto: ApprovalDecisionDto,
    requestId?: string
  ) {
    return this.applyDecision({
      organizationId,
      actorUserId,
      flowId,
      decision: ApprovalDecision.APPROVE,
      reason: dto.reason,
      requestId
    });
  }

  async reject(
    organizationId: string,
    actorUserId: string,
    flowId: string,
    dto: ApprovalDecisionDto,
    requestId?: string
  ) {
    return this.applyDecision({
      organizationId,
      actorUserId,
      flowId,
      decision: ApprovalDecision.REJECT,
      reason: dto.reason,
      requestId
    });
  }

  async requestChanges(
    organizationId: string,
    actorUserId: string,
    flowId: string,
    dto: ApprovalDecisionDto,
    requestId?: string
  ) {
    return this.applyDecision({
      organizationId,
      actorUserId,
      flowId,
      decision: ApprovalDecision.REQUEST_CHANGES,
      reason: dto.reason,
      requestId
    });
  }

  async createInvoiceApprovalFlow(params: {
    organizationId: string;
    invoiceId: string;
    actorUserId: string;
    approverUserIds: string[];
    requestId?: string;
  }) {
    const flow = await this.approvalsRepository.create({
      organization: { connect: { id: params.organizationId } },
      targetEntityType: ApprovalTargetEntityType.INVOICE,
      targetEntityId: params.invoiceId,
      flowType: "invoice.standard",
      initiatedByUser: { connect: { id: params.actorUserId } }
    });

    await this.approvalStepsRepository.createMany(
      params.approverUserIds.map((approverUserId, index) => ({
        approvalFlowId: flow.id,
        stepOrder: index + 1,
        approverUserId
      }))
    );

    const withSteps = await this.requireFlow(flow.id, params.organizationId);
    await this.auditService.record({
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      actionType: "approval.flow.create_for_invoice",
      entityType: "ApprovalFlow",
      entityId: flow.id,
      newValues: ApprovalMapper.flowToResponse(withSteps),
      metadata: { requestId: params.requestId, invoiceId: params.invoiceId }
    });

    return withSteps;
  }

  private async applyDecision(params: {
    organizationId: string;
    actorUserId: string;
    flowId: string;
    decision: ApprovalDecision;
    reason?: string;
    requestId?: string;
  }) {
    const { organizationId, actorUserId, flowId, decision, reason, requestId } =
      params;
    const flow = await this.requireFlow(flowId, organizationId);
    if (flow.status !== ApprovalFlowStatus.PENDING) {
      throw new BadRequestException("Approval flow is not pending");
    }

    const pendingStep = flow.steps.find((step) => step.status === ApprovalStepStatus.PENDING);
    if (!pendingStep) {
      throw new BadRequestException("No pending approval step found");
    }
    if (pendingStep.approverUserId && pendingStep.approverUserId !== actorUserId) {
      throw new ForbiddenException("Current user is not the pending approver");
    }

    await this.approvalStepsRepository.updateStepDecision({
      stepId: pendingStep.id,
      decision,
      reason
    });

    const after = await this.requireFlow(flowId, organizationId);
    const nextPending = after.steps.find((step) => step.status === ApprovalStepStatus.PENDING);

    if (decision === ApprovalDecision.APPROVE && nextPending) {
      await this.auditService.record({
        organizationId,
        actorUserId,
        actionType: "approval.step.approve",
        entityType: "ApprovalStep",
        entityId: pendingStep.id,
        newValues: { decision, reason },
        metadata: { requestId, flowId }
      });
      return ApprovalMapper.flowToResponse(after);
    }

    if (decision === ApprovalDecision.APPROVE) {
      await this.approvalsRepository.update(flowId, {
        status: ApprovalFlowStatus.APPROVED,
        completedAt: new Date()
      });
      if (after.targetEntityType === ApprovalTargetEntityType.INVOICE) {
        await this.approvalsRepository.updateInvoiceStatus(
          after.targetEntityId,
          InvoiceApprovalStatus.APPROVED
        );
      }
    }

    if (decision === ApprovalDecision.REJECT) {
      await this.approvalsRepository.update(flowId, {
        status: ApprovalFlowStatus.REJECTED,
        completedAt: new Date()
      });
      if (after.targetEntityType === ApprovalTargetEntityType.INVOICE) {
        await this.approvalsRepository.updateInvoiceStatus(
          after.targetEntityId,
          InvoiceApprovalStatus.REJECTED
        );
      }
    }

    if (decision === ApprovalDecision.REQUEST_CHANGES) {
      await this.approvalsRepository.update(flowId, {
        status: ApprovalFlowStatus.CHANGES_REQUESTED,
        completedAt: new Date()
      });
      if (after.targetEntityType === ApprovalTargetEntityType.INVOICE) {
        await this.approvalsRepository.updateInvoiceStatus(
          after.targetEntityId,
          InvoiceApprovalStatus.DRAFT
        );
      }
    }

    const finalFlow = await this.requireFlow(flowId, organizationId);
    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "approval.flow.decision",
      entityType: "ApprovalFlow",
      entityId: flowId,
      newValues: {
        decision,
        reason,
        status: finalFlow.status
      },
      metadata: { requestId }
    });

    return ApprovalMapper.flowToResponse(finalFlow);
  }

  private async validateTargetEntity(
    organizationId: string,
    targetEntityType: ApprovalTargetEntityType,
    targetEntityId: string
  ): Promise<void> {
    if (targetEntityType === ApprovalTargetEntityType.INVOICE) {
      const invoice = await this.approvalsRepository.findInvoiceInOrganization(
        targetEntityId,
        organizationId
      );
      if (!invoice) {
        throw new BadRequestException("Target invoice does not belong to organization");
      }
      return;
    }
    throw new BadRequestException("Unsupported approval target entity");
  }

  private async requireFlow(flowId: string, organizationId: string) {
    const flow = await this.approvalsRepository.findByIdScoped(flowId, organizationId);
    if (!flow) {
      throw new NotFoundException("Approval flow not found");
    }
    return flow;
  }
}


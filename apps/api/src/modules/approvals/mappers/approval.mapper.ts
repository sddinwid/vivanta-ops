import { Injectable } from "@nestjs/common";
import { ApprovalFlow, ApprovalStep } from "@prisma/client";

@Injectable()
export class ApprovalMapper {
  static flowToResponse(
    flow: ApprovalFlow & {
      steps?: ApprovalStep[];
    }
  ) {
    return {
      id: flow.id,
      organizationId: flow.organizationId,
      targetEntityType: flow.targetEntityType,
      targetEntityId: flow.targetEntityId,
      flowType: flow.flowType,
      status: flow.status,
      initiatedByUserId: flow.initiatedByUserId,
      startedAt: flow.startedAt,
      completedAt: flow.completedAt,
      createdAt: flow.createdAt,
      steps:
        flow.steps?.map((step) => ({
          id: step.id,
          approvalFlowId: step.approvalFlowId,
          stepOrder: step.stepOrder,
          approverUserId: step.approverUserId,
          approverRole: step.approverRole,
          status: step.status,
          decision: step.decision,
          decisionReason: step.decisionReason,
          actedAt: step.actedAt,
          createdAt: step.createdAt
        })) ?? []
    };
  }
}


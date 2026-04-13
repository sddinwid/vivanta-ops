import { Injectable } from "@nestjs/common";
import { ApprovalDecision, ApprovalStep, ApprovalStepStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";

@Injectable()
export class ApprovalStepsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByFlow(approvalFlowId: string): Promise<ApprovalStep[]> {
    return this.prisma.approvalStep.findMany({
      where: { approvalFlowId },
      orderBy: { stepOrder: "asc" }
    });
  }

  createMany(data: Prisma.ApprovalStepCreateManyInput[]): Promise<void> {
    return this.prisma.approvalStep
      .createMany({
        data,
        skipDuplicates: true
      })
      .then(() => undefined);
  }

  updateStepDecision(params: {
    stepId: string;
    decision: ApprovalDecision;
    reason?: string;
  }): Promise<ApprovalStep> {
    return this.prisma.approvalStep.update({
      where: { id: params.stepId },
      data: {
        status: ApprovalStepStatus.COMPLETED,
        decision: params.decision,
        decisionReason: params.reason,
        actedAt: new Date()
      }
    });
  }
}


import { Injectable } from "@nestjs/common";
import {
  ApprovalFlow,
  ApprovalFlowStatus,
  ApprovalTargetEntityType,
  InvoiceApprovalStatus,
  Prisma
} from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";
import { ApprovalFiltersDto } from "../dto/approval-filters.dto";

@Injectable()
export class ApprovalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByOrganization(organizationId: string, filters: ApprovalFiltersDto) {
    return this.prisma.approvalFlow.findMany({
      where: {
        organizationId,
        targetEntityType: filters.targetEntityType,
        targetEntityId: filters.targetEntityId,
        status: filters.status
      },
      include: { steps: true },
      orderBy: { createdAt: "desc" },
      skip: filters.offset,
      take: filters.limit
    });
  }

  countByOrganization(organizationId: string, filters: ApprovalFiltersDto): Promise<number> {
    return this.prisma.approvalFlow.count({
      where: {
        organizationId,
        targetEntityType: filters.targetEntityType,
        targetEntityId: filters.targetEntityId,
        status: filters.status
      }
    });
  }

  findByIdScoped(flowId: string, organizationId: string) {
    return this.prisma.approvalFlow.findFirst({
      where: { id: flowId, organizationId },
      include: {
        steps: {
          orderBy: { stepOrder: "asc" }
        }
      }
    });
  }

  create(data: Prisma.ApprovalFlowCreateInput): Promise<ApprovalFlow> {
    return this.prisma.approvalFlow.create({ data });
  }

  update(flowId: string, data: Prisma.ApprovalFlowUpdateInput) {
    return this.prisma.approvalFlow.update({
      where: { id: flowId },
      data
    });
  }

  updateInvoiceStatus(invoiceId: string, status: InvoiceApprovalStatus) {
    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { approvalStatus: status }
    });
  }

  findInvoiceInOrganization(invoiceId: string, organizationId: string) {
    return this.prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId },
      select: { id: true, approvalStatus: true }
    });
  }
}

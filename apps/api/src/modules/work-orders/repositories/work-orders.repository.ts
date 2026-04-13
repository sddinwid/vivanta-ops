import { Injectable } from "@nestjs/common";
import { Prisma, WorkOrder, WorkOrderStatus } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";
import { WorkOrderFiltersDto } from "../dto/work-order-filters.dto";

@Injectable()
export class WorkOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByOrganization(organizationId: string, filters: WorkOrderFiltersDto) {
    return this.prisma.workOrder.findMany({
      where: {
        case: { organizationId },
        status: filters.status,
        vendorId: filters.vendorId,
        caseId: filters.caseId,
        createdAt:
          filters.createdFrom || filters.createdTo
            ? {
                gte: filters.createdFrom
                  ? new Date(filters.createdFrom)
                  : undefined,
                lte: filters.createdTo ? new Date(filters.createdTo) : undefined
              }
            : undefined,
        OR: filters.search
          ? [
              { workOrderNumber: { contains: filters.search, mode: "insensitive" } },
              { description: { contains: filters.search, mode: "insensitive" } }
            ]
          : undefined
      },
      orderBy: { updatedAt: "desc" },
      skip: filters.offset,
      take: filters.limit
    });
  }

  countByOrganization(organizationId: string, filters: WorkOrderFiltersDto): Promise<number> {
    return this.prisma.workOrder.count({
      where: {
        case: { organizationId },
        status: filters.status,
        vendorId: filters.vendorId,
        caseId: filters.caseId,
        createdAt:
          filters.createdFrom || filters.createdTo
            ? {
                gte: filters.createdFrom
                  ? new Date(filters.createdFrom)
                  : undefined,
                lte: filters.createdTo ? new Date(filters.createdTo) : undefined
              }
            : undefined,
        OR: filters.search
          ? [
              { workOrderNumber: { contains: filters.search, mode: "insensitive" } },
              { description: { contains: filters.search, mode: "insensitive" } }
            ]
          : undefined
      }
    });
  }

  findByIdScoped(workOrderId: string, organizationId: string): Promise<WorkOrder | null> {
    return this.prisma.workOrder.findFirst({
      where: {
        id: workOrderId,
        case: { organizationId }
      }
    });
  }

  create(data: Prisma.WorkOrderCreateInput): Promise<WorkOrder> {
    return this.prisma.workOrder.create({ data });
  }

  update(workOrderId: string, data: Prisma.WorkOrderUpdateInput): Promise<WorkOrder> {
    return this.prisma.workOrder.update({
      where: { id: workOrderId },
      data
    });
  }

  findCaseInOrganization(caseId: string, organizationId: string) {
    return this.prisma.case.findFirst({
      where: { id: caseId, organizationId },
      select: { id: true }
    });
  }

  findVendorInOrganization(vendorId: string, organizationId: string) {
    return this.prisma.vendor.findFirst({
      where: { id: vendorId, organizationId },
      select: { id: true }
    });
  }

  nextWorkOrderNumberSeed(caseId: string): Promise<number> {
    return this.prisma.workOrder.count({
      where: { caseId }
    });
  }
}


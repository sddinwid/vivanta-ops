import { Injectable } from "@nestjs/common";
import { AiRun, Prisma } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";
import { AiRunFiltersDto } from "../dto/ai-run-filters.dto";

@Injectable()
export class AiRunsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByOrganization(organizationId: string, filters: AiRunFiltersDto) {
    return this.prisma.aiRun.findMany({
      where: {
        organizationId,
        capability: filters.capability,
        status: filters.status,
        targetEntityType: filters.targetEntityType,
        targetEntityId: filters.targetEntityId,
        createdAt:
          filters.createdFrom || filters.createdTo
            ? {
                gte: filters.createdFrom ? new Date(filters.createdFrom) : undefined,
                lte: filters.createdTo ? new Date(filters.createdTo) : undefined
              }
            : undefined
      },
      include: {
        promptTemplate: true,
        suggestions: true
      },
      orderBy: { createdAt: "desc" },
      skip: filters.offset,
      take: filters.limit
    });
  }

  countByOrganization(organizationId: string, filters: AiRunFiltersDto): Promise<number> {
    return this.prisma.aiRun.count({
      where: {
        organizationId,
        capability: filters.capability,
        status: filters.status,
        targetEntityType: filters.targetEntityType,
        targetEntityId: filters.targetEntityId,
        createdAt:
          filters.createdFrom || filters.createdTo
            ? {
                gte: filters.createdFrom ? new Date(filters.createdFrom) : undefined,
                lte: filters.createdTo ? new Date(filters.createdTo) : undefined
              }
            : undefined
      }
    });
  }

  findByIdScoped(aiRunId: string, organizationId: string) {
    return this.prisma.aiRun.findFirst({
      where: { id: aiRunId, organizationId },
      include: {
        promptTemplate: true,
        suggestions: true
      }
    });
  }

  create(data: Prisma.AiRunCreateInput): Promise<AiRun> {
    return this.prisma.aiRun.create({ data });
  }

  update(aiRunId: string, data: Prisma.AiRunUpdateInput): Promise<AiRun> {
    return this.prisma.aiRun.update({
      where: { id: aiRunId },
      data
    });
  }

  findEntityInOrganization(
    organizationId: string,
    entityType: string,
    entityId: string
  ): Promise<boolean> {
    const normalized = entityType.toLowerCase();
    switch (normalized) {
      case "property":
        return this.prisma.property
          .findFirst({ where: { id: entityId, organizationId }, select: { id: true } })
          .then(Boolean);
      case "owner":
        return this.prisma.owner
          .findFirst({ where: { id: entityId, organizationId }, select: { id: true } })
          .then(Boolean);
      case "vendor":
        return this.prisma.vendor
          .findFirst({ where: { id: entityId, organizationId }, select: { id: true } })
          .then(Boolean);
      case "document":
        return this.prisma.document
          .findFirst({ where: { id: entityId, organizationId }, select: { id: true } })
          .then(Boolean);
      case "communicationthread":
      case "communication_thread":
      case "communication":
        return this.prisma.communicationThread
          .findFirst({ where: { id: entityId, organizationId }, select: { id: true } })
          .then(Boolean);
      case "case":
        return this.prisma.case
          .findFirst({ where: { id: entityId, organizationId }, select: { id: true } })
          .then(Boolean);
      case "task":
        return this.prisma.task
          .findFirst({ where: { id: entityId, organizationId }, select: { id: true } })
          .then(Boolean);
      case "workorder":
      case "work_order":
        return this.prisma.workOrder
          .findFirst({ where: { id: entityId, case: { organizationId } }, select: { id: true } })
          .then(Boolean);
      case "invoice":
        return this.prisma.invoice
          .findFirst({ where: { id: entityId, organizationId }, select: { id: true } })
          .then(Boolean);
      case "approvalflow":
      case "approval_flow":
        return this.prisma.approvalFlow
          .findFirst({ where: { id: entityId, organizationId }, select: { id: true } })
          .then(Boolean);
      default:
        return Promise.resolve(false);
    }
  }
}

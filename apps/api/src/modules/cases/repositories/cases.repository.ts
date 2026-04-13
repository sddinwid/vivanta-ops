import { Injectable } from "@nestjs/common";
import { Case, CaseStatus, OperationalPriority, Prisma } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";
import { CaseFiltersDto } from "../dto/case-filters.dto";

@Injectable()
export class CasesRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByOrganization(organizationId: string, filters: CaseFiltersDto): Promise<Case[]> {
    return this.prisma.case.findMany({
      where: {
        organizationId,
        status: filters.status,
        priority: filters.priority,
        assignedUserId: filters.assignedUserId,
        propertyId: filters.propertyId,
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
              { title: { contains: filters.search, mode: "insensitive" } },
              { description: { contains: filters.search, mode: "insensitive" } }
            ]
          : undefined
      },
      orderBy: { updatedAt: "desc" },
      skip: filters.offset,
      take: filters.limit
    });
  }

  countByOrganization(organizationId: string, filters: CaseFiltersDto): Promise<number> {
    return this.prisma.case.count({
      where: {
        organizationId,
        status: filters.status,
        priority: filters.priority,
        assignedUserId: filters.assignedUserId,
        propertyId: filters.propertyId,
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
              { title: { contains: filters.search, mode: "insensitive" } },
              { description: { contains: filters.search, mode: "insensitive" } }
            ]
          : undefined
      }
    });
  }

  findByIdScoped(caseId: string, organizationId: string): Promise<Case | null> {
    return this.prisma.case.findFirst({
      where: { id: caseId, organizationId }
    });
  }

  create(data: Prisma.CaseCreateInput): Promise<Case> {
    return this.prisma.case.create({ data });
  }

  update(caseId: string, data: Prisma.CaseUpdateInput): Promise<Case> {
    return this.prisma.case.update({
      where: { id: caseId },
      data
    });
  }

  findUserInOrganization(userId: string, organizationId: string) {
    return this.prisma.user.findFirst({
      where: { id: userId, organizationId },
      select: { id: true }
    });
  }

  findPropertyInOrganization(propertyId: string, organizationId: string) {
    return this.prisma.property.findFirst({
      where: { id: propertyId, organizationId },
      select: { id: true }
    });
  }

  findUnitInOrganization(unitId: string, organizationId: string) {
    return this.prisma.unit.findFirst({
      where: {
        id: unitId,
        property: {
          organizationId
        }
      },
      select: { id: true, propertyId: true }
    });
  }

  queueOpen(organizationId: string): Promise<Case[]> {
    return this.prisma.case.findMany({
      where: {
        organizationId,
        status: { in: [CaseStatus.OPEN, CaseStatus.IN_PROGRESS] }
      },
      orderBy: { updatedAt: "desc" },
      take: 100
    });
  }

  queueEscalated(organizationId: string): Promise<Case[]> {
    return this.prisma.case.findMany({
      where: {
        organizationId,
        OR: [
          { priority: { in: [OperationalPriority.HIGH, OperationalPriority.URGENT] } },
          {
            dueAt: { lt: new Date() },
            status: { in: [CaseStatus.OPEN, CaseStatus.IN_PROGRESS, CaseStatus.WAITING] }
          }
        ]
      },
      orderBy: { updatedAt: "desc" },
      take: 100
    });
  }

  queueWaiting(organizationId: string): Promise<Case[]> {
    return this.prisma.case.findMany({
      where: {
        organizationId,
        status: CaseStatus.WAITING
      },
      orderBy: { updatedAt: "desc" },
      take: 100
    });
  }
}

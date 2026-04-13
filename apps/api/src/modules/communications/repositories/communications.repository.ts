import { Injectable } from "@nestjs/common";
import { CommunicationPriority, CommunicationThread, Prisma } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";
import { CommunicationFiltersDto } from "../dto/communication-filters.dto";

@Injectable()
export class CommunicationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByOrganization(
    organizationId: string,
    filters: CommunicationFiltersDto
  ) {
    return this.prisma.communicationThread.findMany({
      where: {
        organizationId,
        channelType: filters.channelType,
        status: filters.status,
        priority: filters.priority,
        assignedUserId: filters.assignedUserId,
        linkedEntityType: filters.linkedEntityType,
        linkedEntityId: filters.linkedEntityId,
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
              { subject: { contains: filters.search, mode: "insensitive" } },
              {
                messages: {
                  some: {
                    bodyText: { contains: filters.search, mode: "insensitive" }
                  }
                }
              }
            ]
          : undefined
      },
      orderBy: { updatedAt: "desc" },
      skip: filters.offset,
      take: filters.limit
    });
  }

  countByOrganization(
    organizationId: string,
    filters: CommunicationFiltersDto
  ): Promise<number> {
    return this.prisma.communicationThread.count({
      where: {
        organizationId,
        channelType: filters.channelType,
        status: filters.status,
        priority: filters.priority,
        assignedUserId: filters.assignedUserId,
        linkedEntityType: filters.linkedEntityType,
        linkedEntityId: filters.linkedEntityId,
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
              { subject: { contains: filters.search, mode: "insensitive" } },
              {
                messages: {
                  some: {
                    bodyText: { contains: filters.search, mode: "insensitive" }
                  }
                }
              }
            ]
          : undefined
      }
    });
  }

  findByIdScoped(threadId: string, organizationId: string) {
    return this.prisma.communicationThread.findFirst({
      where: { id: threadId, organizationId }
    });
  }

  create(data: Prisma.CommunicationThreadCreateInput): Promise<CommunicationThread> {
    return this.prisma.communicationThread.create({ data });
  }

  update(
    threadId: string,
    data: Prisma.CommunicationThreadUpdateInput
  ): Promise<CommunicationThread> {
    return this.prisma.communicationThread.update({
      where: { id: threadId },
      data
    });
  }

  queueInbox(organizationId: string) {
    return this.prisma.communicationThread.findMany({
      where: { organizationId },
      orderBy: { updatedAt: "desc" },
      take: 100
    });
  }

  queueUnassigned(organizationId: string) {
    return this.prisma.communicationThread.findMany({
      where: { organizationId, assignedUserId: null },
      orderBy: { updatedAt: "desc" },
      take: 100
    });
  }

  queueUrgent(organizationId: string) {
    return this.prisma.communicationThread.findMany({
      where: { organizationId, priority: CommunicationPriority.URGENT },
      orderBy: { updatedAt: "desc" },
      take: 100
    });
  }

  findUserInOrganization(userId: string, organizationId: string) {
    return this.prisma.user.findFirst({
      where: { id: userId, organizationId },
      select: { id: true }
    });
  }
}

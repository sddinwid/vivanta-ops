import { Injectable } from "@nestjs/common";
import { DocumentLinkedEntityType, Prisma } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";
import { PortalCaseFiltersDto } from "../dto/portal-case-filters.dto";
import { PortalCommunicationFiltersDto } from "../dto/portal-communication-filters.dto";
import { PortalDocumentFiltersDto } from "../dto/portal-document-filters.dto";
import { PortalPropertyFiltersDto } from "../dto/portal-property-filters.dto";

@Injectable()
export class PortalRepository {
  constructor(private readonly prisma: PrismaService) {}

  getPortalUserContext(userId: string, organizationId: string) {
    return this.prisma.user.findFirst({
      where: { id: userId, organizationId },
      include: {
        organization: true,
        owner: true
      }
    });
  }

  listOwnerPropertyIds(ownerId: string, organizationId: string): Promise<string[]> {
    return this.prisma.propertyOwnerLink
      .findMany({
        where: {
          ownerId,
          property: { organizationId }
        },
        select: { propertyId: true }
      })
      .then((rows) => rows.map((row) => row.propertyId));
  }

  listOwnerProperties(ownerId: string, organizationId: string, filters: PortalPropertyFiltersDto) {
    return this.prisma.property.findMany({
      where: {
        organizationId,
        ownerLinks: {
          some: { ownerId }
        }
      },
      include: {
        _count: {
          select: {
            buildings: true,
            units: true
          }
        },
        ownerLinks: {
          where: { ownerId },
          select: {
            ownershipPercentage: true,
            startDate: true,
            endDate: true,
            isPrimaryContact: true,
            createdAt: true
          }
        }
      },
      orderBy: { name: "asc" },
      skip: filters.offset,
      take: filters.limit
    });
  }

  countOwnerProperties(ownerId: string, organizationId: string): Promise<number> {
    return this.prisma.property.count({
      where: {
        organizationId,
        ownerLinks: {
          some: { ownerId }
        }
      }
    });
  }

  findOwnerPropertyById(ownerId: string, organizationId: string, propertyId: string) {
    return this.prisma.property.findFirst({
      where: {
        id: propertyId,
        organizationId,
        ownerLinks: {
          some: { ownerId }
        }
      },
      include: {
        _count: {
          select: {
            buildings: true,
            units: true
          }
        },
        ownerLinks: {
          where: { ownerId },
          select: {
            ownershipPercentage: true,
            startDate: true,
            endDate: true,
            isPrimaryContact: true,
            createdAt: true
          }
        }
      }
    });
  }

  listPropertyDocuments(organizationId: string, propertyId: string, filters: PortalDocumentFiltersDto) {
    return this.prisma.document.findMany({
      where: {
        organizationId,
        documentType: filters.documentType,
        createdAt:
          filters.createdFrom || filters.createdTo
            ? {
                gte: filters.createdFrom ? new Date(filters.createdFrom) : undefined,
                lte: filters.createdTo ? new Date(filters.createdTo) : undefined
              }
            : undefined,
        links: {
          some: {
            linkedEntityType: DocumentLinkedEntityType.PROPERTY,
            linkedEntityId: propertyId
          }
        }
      },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        fileSizeBytes: true,
        documentType: true,
        ingestionStatus: true,
        sourceType: true,
        sourceReference: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: "desc" },
      skip: filters.offset,
      take: filters.limit
    });
  }

  countPropertyDocuments(organizationId: string, propertyId: string, filters: PortalDocumentFiltersDto): Promise<number> {
    return this.prisma.document.count({
      where: {
        organizationId,
        documentType: filters.documentType,
        createdAt:
          filters.createdFrom || filters.createdTo
            ? {
                gte: filters.createdFrom ? new Date(filters.createdFrom) : undefined,
                lte: filters.createdTo ? new Date(filters.createdTo) : undefined
              }
            : undefined,
        links: {
          some: {
            linkedEntityType: DocumentLinkedEntityType.PROPERTY,
            linkedEntityId: propertyId
          }
        }
      }
    });
  }

  listPropertyCases(organizationId: string, propertyId: string, filters: PortalCaseFiltersDto) {
    return this.prisma.case.findMany({
      where: {
        organizationId,
        propertyId,
        ownerVisibleStatus: filters.ownerVisibleStatus ?? { not: null },
        priority: filters.priority,
        createdAt:
          filters.createdFrom || filters.createdTo
            ? {
                gte: filters.createdFrom ? new Date(filters.createdFrom) : undefined,
                lte: filters.createdTo ? new Date(filters.createdTo) : undefined
              }
            : undefined
      },
      select: {
        id: true,
        title: true,
        priority: true,
        ownerVisibleStatus: true,
        description: true,
        openedAt: true,
        updatedAt: true
      },
      orderBy: { updatedAt: "desc" },
      skip: filters.offset,
      take: filters.limit
    });
  }

  countPropertyCases(organizationId: string, propertyId: string, filters: PortalCaseFiltersDto): Promise<number> {
    return this.prisma.case.count({
      where: {
        organizationId,
        propertyId,
        ownerVisibleStatus: filters.ownerVisibleStatus ?? { not: null },
        priority: filters.priority,
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

  listCommunications(
    organizationId: string,
    ownerId: string,
    accessiblePropertyIds: string[],
    filters: PortalCommunicationFiltersDto
  ) {
    const where = this.portalCommunicationWhere(
      organizationId,
      ownerId,
      accessiblePropertyIds,
      filters
    );

    return this.prisma.communicationThread.findMany({
      where,
      select: {
        id: true,
        channelType: true,
        subject: true,
        status: true,
        priority: true,
        linkedEntityType: true,
        linkedEntityId: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          select: {
            id: true,
            direction: true,
            bodyText: true,
            bodyHtml: true,
            messageStatus: true,
            sentAt: true,
            receivedAt: true,
            createdAt: true
          },
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: { updatedAt: "desc" },
      skip: filters.offset,
      take: filters.limit
    });
  }

  countCommunications(
    organizationId: string,
    ownerId: string,
    accessiblePropertyIds: string[],
    filters: PortalCommunicationFiltersDto
  ): Promise<number> {
    return this.prisma.communicationThread.count({
      where: this.portalCommunicationWhere(
        organizationId,
        ownerId,
        accessiblePropertyIds,
        filters
      )
    });
  }

  findCommunicationById(
    organizationId: string,
    ownerId: string,
    accessiblePropertyIds: string[],
    threadId: string
  ) {
    return this.prisma.communicationThread.findFirst({
      where: {
        id: threadId,
        ...this.portalCommunicationWhere(
          organizationId,
          ownerId,
          accessiblePropertyIds,
          {}
        )
      },
      select: {
        id: true,
        channelType: true,
        subject: true,
        status: true,
        priority: true,
        linkedEntityType: true,
        linkedEntityId: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          select: {
            id: true,
            direction: true,
            bodyText: true,
            bodyHtml: true,
            messageStatus: true,
            sentAt: true,
            receivedAt: true,
            createdAt: true
          },
          orderBy: { createdAt: "asc" }
        }
      }
    });
  }

  private portalCommunicationWhere(
    organizationId: string,
    ownerId: string,
    accessiblePropertyIds: string[],
    filters: Partial<PortalCommunicationFiltersDto>
  ): Prisma.CommunicationThreadWhereInput {
    const accessPredicate: Prisma.CommunicationThreadWhereInput = {
      OR: [
        {
          linkedEntityType: DocumentLinkedEntityType.OWNER,
          linkedEntityId: ownerId
        },
        {
          linkedEntityType: DocumentLinkedEntityType.PROPERTY,
          linkedEntityId: { in: accessiblePropertyIds }
        }
      ]
    };

    return {
      organizationId,
      channelType: filters.channelType,
      status: filters.status,
      ...(filters.propertyId
        ? {
            linkedEntityType: DocumentLinkedEntityType.PROPERTY,
            linkedEntityId: filters.propertyId
          }
        : {}),
      AND: [accessPredicate]
    };
  }
}

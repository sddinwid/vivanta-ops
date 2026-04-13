import { PortalAccessContext } from "../services/portal-access.service";

export class PortalMapper {
  static toMeResponse(context: PortalAccessContext) {
    return {
      user: {
        id: context.userId,
        email: context.email,
        firstName: context.firstName,
        lastName: context.lastName
      },
      owner: {
        id: context.ownerId,
        displayName: context.ownerDisplayName,
        email: context.ownerEmail,
        phone: context.ownerPhone,
        isCompany: context.ownerIsCompany,
        status: context.ownerStatus
      },
      organization: {
        id: context.organizationId,
        name: context.organizationName,
        slug: context.organizationSlug
      }
    };
  }

  static toPortalProperty(property: {
    id: string;
    propertyCode: string;
    name: string;
    street: string | null;
    city: string | null;
    postalCode: string | null;
    countryCode: string | null;
    status: string;
    propertyType: string;
    createdAt: Date;
    updatedAt: Date;
    _count: { buildings: number; units: number };
    ownerLinks: Array<{
      ownershipPercentage: number | null;
      startDate: Date | null;
      endDate: Date | null;
      isPrimaryContact: boolean;
      createdAt: Date;
    }>;
  }) {
    const link = property.ownerLinks[0] ?? null;
    return {
      id: property.id,
      propertyCode: property.propertyCode,
      name: property.name,
      street: property.street,
      city: property.city,
      postalCode: property.postalCode,
      countryCode: property.countryCode,
      status: property.status,
      propertyType: property.propertyType,
      buildingCount: property._count.buildings,
      unitCount: property._count.units,
      ownerLink: link
        ? {
            ownershipPercentage: link.ownershipPercentage,
            startDate: link.startDate,
            endDate: link.endDate,
            isPrimaryContact: link.isPrimaryContact,
            linkedAt: link.createdAt
          }
        : null,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt
    };
  }

  static toPortalDocument(document: {
    id: string;
    fileName: string;
    mimeType: string | null;
    fileSizeBytes: number | null;
    documentType: string | null;
    ingestionStatus: string;
    sourceType: string | null;
    sourceReference: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: document.id,
      fileName: document.fileName,
      mimeType: document.mimeType,
      fileSizeBytes: document.fileSizeBytes,
      documentType: document.documentType,
      ingestionStatus: document.ingestionStatus,
      sourceType: document.sourceType,
      sourceReference: document.sourceReference,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt
    };
  }

  static toPortalCase(item: {
    id: string;
    title: string;
    priority: string;
    ownerVisibleStatus: string | null;
    description: string | null;
    openedAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: item.id,
      title: item.title,
      priority: item.priority,
      ownerVisibleStatus: item.ownerVisibleStatus,
      description: item.description,
      openedAt: item.openedAt,
      updatedAt: item.updatedAt
    };
  }

  static toPortalCommunication(thread: {
    id: string;
    channelType: string;
    subject: string | null;
    status: string;
    priority: string;
    linkedEntityType: string | null;
    linkedEntityId: string | null;
    createdAt: Date;
    updatedAt: Date;
    messages: Array<{
      id: string;
      direction: string;
      bodyText: string | null;
      bodyHtml: string | null;
      messageStatus: string | null;
      sentAt: Date | null;
      receivedAt: Date | null;
      createdAt: Date;
    }>;
  }) {
    return {
      id: thread.id,
      channelType: thread.channelType,
      subject: thread.subject,
      status: thread.status,
      priority: thread.priority,
      linkedEntityType: thread.linkedEntityType,
      linkedEntityId: thread.linkedEntityId,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      messages: thread.messages.map((message) => ({
        id: message.id,
        direction: message.direction,
        bodyText: message.bodyText,
        bodyHtml: message.bodyHtml,
        messageStatus: message.messageStatus,
        sentAt: message.sentAt,
        receivedAt: message.receivedAt,
        createdAt: message.createdAt
      }))
    };
  }
}

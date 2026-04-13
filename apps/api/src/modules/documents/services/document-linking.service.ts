import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  DocumentLinkedEntityType,
  DocumentLink,
  Prisma
} from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";
import { AuditService } from "../../audit/services/audit.service";
import { DocumentLinksRepository } from "../repositories/document-links.repository";

@Injectable()
export class DocumentLinkingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly linksRepository: DocumentLinksRepository,
    private readonly auditService: AuditService
  ) {}

  listLinks(documentId: string): Promise<DocumentLink[]> {
    return this.linksRepository.listByDocument(documentId);
  }

  validateLinkTarget(
    organizationId: string,
    linkedEntityType: DocumentLinkedEntityType,
    linkedEntityId: string
  ): Promise<void> {
    return this.validateTargetEntity(
      organizationId,
      linkedEntityType,
      linkedEntityId
    );
  }

  async createLink(params: {
    organizationId: string;
    actorUserId: string;
    documentId: string;
    linkedEntityType: DocumentLinkedEntityType;
    linkedEntityId: string;
    linkRole?: string;
    requestId?: string;
  }): Promise<DocumentLink> {
    const {
      organizationId,
      actorUserId,
      documentId,
      linkedEntityType,
      linkedEntityId,
      linkRole,
      requestId
    } = params;

    await this.validateTargetEntity(
      organizationId,
      linkedEntityType,
      linkedEntityId
    );

    const existing = await this.linksRepository.findLink(
      documentId,
      linkedEntityType,
      linkedEntityId
    );
    if (existing) {
      throw new BadRequestException("Duplicate document link is not allowed");
    }

    try {
      const link = await this.linksRepository.create({
        document: { connect: { id: documentId } },
        linkedEntityType,
        linkedEntityId,
        linkRole
      });

      await this.auditService.record({
        organizationId,
        actorUserId,
        actionType: "document.link.create",
        entityType: "DocumentLink",
        entityId: `${documentId}:${linkedEntityType}:${linkedEntityId}`,
        newValues: link,
        metadata: { requestId, linkRole }
      });

      return link;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new BadRequestException("Duplicate document link is not allowed");
      }
      throw error;
    }
  }

  async deleteLink(params: {
    organizationId: string;
    actorUserId: string;
    documentId: string;
    linkedEntityType: DocumentLinkedEntityType;
    linkedEntityId: string;
    requestId?: string;
  }): Promise<DocumentLink> {
    const {
      organizationId,
      actorUserId,
      documentId,
      linkedEntityType,
      linkedEntityId,
      requestId
    } = params;

    const link = await this.linksRepository.findLink(
      documentId,
      linkedEntityType,
      linkedEntityId
    );
    if (!link) {
      throw new NotFoundException("Document link not found");
    }

    const removed = await this.linksRepository.delete(
      documentId,
      linkedEntityType,
      linkedEntityId
    );
    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "document.link.delete",
      entityType: "DocumentLink",
      entityId: `${documentId}:${linkedEntityType}:${linkedEntityId}`,
      oldValues: link,
      metadata: { requestId }
    });
    return removed;
  }

  private async validateTargetEntity(
    organizationId: string,
    linkedEntityType: DocumentLinkedEntityType,
    linkedEntityId: string
  ): Promise<void> {
    if (linkedEntityType === "PROPERTY") {
      const exists = await this.prisma.property.findFirst({
        where: { id: linkedEntityId, organizationId },
        select: { id: true }
      });
      if (!exists) {
        throw new BadRequestException(
          "Linked property does not belong to this organization"
        );
      }
      return;
    }

    if (linkedEntityType === "OWNER") {
      const exists = await this.prisma.owner.findFirst({
        where: { id: linkedEntityId, organizationId },
        select: { id: true }
      });
      if (!exists) {
        throw new BadRequestException(
          "Linked owner does not belong to this organization"
        );
      }
      return;
    }

    if (linkedEntityType === "VENDOR") {
      const exists = await this.prisma.vendor.findFirst({
        where: { id: linkedEntityId, organizationId },
        select: { id: true }
      });
      if (!exists) {
        throw new BadRequestException(
          "Linked vendor does not belong to this organization"
        );
      }
      return;
    }

    throw new BadRequestException("Unsupported linked entity type");
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { DocumentLinkedEntityType } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";
import { AuditService } from "../../audit/services/audit.service";
import { CommunicationsRepository } from "../repositories/communications.repository";

@Injectable()
export class CommunicationLinkingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly communicationsRepository: CommunicationsRepository,
    private readonly auditService: AuditService
  ) {}

  async validateLinkedEntity(params: {
    organizationId: string;
    linkedEntityType: DocumentLinkedEntityType;
    linkedEntityId: string;
  }): Promise<void> {
    const { organizationId, linkedEntityType, linkedEntityId } = params;

    if (linkedEntityType === "PROPERTY") {
      const property = await this.prisma.property.findFirst({
        where: { id: linkedEntityId, organizationId },
        select: { id: true }
      });
      if (!property) {
        throw new BadRequestException(
          "Linked property does not belong to this organization"
        );
      }
      return;
    }

    if (linkedEntityType === "OWNER") {
      const owner = await this.prisma.owner.findFirst({
        where: { id: linkedEntityId, organizationId },
        select: { id: true }
      });
      if (!owner) {
        throw new BadRequestException(
          "Linked owner does not belong to this organization"
        );
      }
      return;
    }

    if (linkedEntityType === "VENDOR") {
      const vendor = await this.prisma.vendor.findFirst({
        where: { id: linkedEntityId, organizationId },
        select: { id: true }
      });
      if (!vendor) {
        throw new BadRequestException(
          "Linked vendor does not belong to this organization"
        );
      }
      return;
    }
  }

  async linkThread(params: {
    organizationId: string;
    actorUserId: string;
    threadId: string;
    linkedEntityType: DocumentLinkedEntityType;
    linkedEntityId: string;
    requestId?: string;
  }) {
    const {
      organizationId,
      actorUserId,
      threadId,
      linkedEntityType,
      linkedEntityId,
      requestId
    } = params;

    const thread = await this.communicationsRepository.findByIdScoped(
      threadId,
      organizationId
    );
    if (!thread) {
      throw new NotFoundException("Communication thread not found");
    }

    await this.validateLinkedEntity({
      organizationId,
      linkedEntityType,
      linkedEntityId
    });

    const updated = await this.communicationsRepository.update(threadId, {
      linkedEntityType,
      linkedEntityId
    });

    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "communication.thread.link",
      entityType: "CommunicationThread",
      entityId: threadId,
      oldValues: {
        linkedEntityType: thread.linkedEntityType,
        linkedEntityId: thread.linkedEntityId
      },
      newValues: {
        linkedEntityType: updated.linkedEntityType,
        linkedEntityId: updated.linkedEntityId
      },
      metadata: { requestId }
    });

    return updated;
  }
}


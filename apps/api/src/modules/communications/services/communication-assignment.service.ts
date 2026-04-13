import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { AuditService } from "../../audit/services/audit.service";
import { CommunicationsRepository } from "../repositories/communications.repository";

@Injectable()
export class CommunicationAssignmentService {
  constructor(
    private readonly communicationsRepository: CommunicationsRepository,
    private readonly auditService: AuditService
  ) {}

  async assignThread(params: {
    organizationId: string;
    actorUserId: string;
    threadId: string;
    assignedUserId: string | null;
    requestId?: string;
  }) {
    const { organizationId, actorUserId, threadId, assignedUserId, requestId } =
      params;
    const thread = await this.communicationsRepository.findByIdScoped(
      threadId,
      organizationId
    );
    if (!thread) {
      throw new NotFoundException("Communication thread not found");
    }

    if (assignedUserId) {
      const assignee = await this.communicationsRepository.findUserInOrganization(
        assignedUserId,
        organizationId
      );
      if (!assignee) {
        throw new BadRequestException(
          "assignedUserId must belong to the same organization"
        );
      }
    }

    const updated = await this.communicationsRepository.update(threadId, {
      assignedUserId
    });

    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "communication.thread.assign",
      entityType: "CommunicationThread",
      entityId: threadId,
      oldValues: { assignedUserId: thread.assignedUserId },
      newValues: { assignedUserId: updated.assignedUserId },
      metadata: { requestId }
    });

    return updated;
  }
}


import { Injectable } from "@nestjs/common";
import { CommunicationThread } from "@prisma/client";

@Injectable()
export class CommunicationMapper {
  static toResponse(thread: CommunicationThread) {
    return {
      id: thread.id,
      organizationId: thread.organizationId,
      channelType: thread.channelType,
      subject: thread.subject,
      status: thread.status,
      priority: thread.priority,
      linkedEntityType: thread.linkedEntityType,
      linkedEntityId: thread.linkedEntityId,
      createdByUserId: thread.createdByUserId,
      assignedUserId: thread.assignedUserId,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt
    };
  }
}


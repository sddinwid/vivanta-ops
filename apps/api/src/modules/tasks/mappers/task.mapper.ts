import { Injectable } from "@nestjs/common";
import { Task } from "@prisma/client";

@Injectable()
export class TaskMapper {
  static toResponse(item: Task) {
    return {
      id: item.id,
      organizationId: item.organizationId,
      taskType: item.taskType,
      title: item.title,
      description: item.description,
      status: item.status,
      priority: item.priority,
      assignedUserId: item.assignedUserId,
      relatedEntityType: item.relatedEntityType,
      relatedEntityId: item.relatedEntityId,
      dueAt: item.dueAt,
      completedAt: item.completedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }
}


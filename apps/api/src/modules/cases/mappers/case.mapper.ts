import { Injectable } from "@nestjs/common";
import { Case } from "@prisma/client";

@Injectable()
export class CaseMapper {
  static toResponse(item: Case) {
    return {
      id: item.id,
      organizationId: item.organizationId,
      propertyId: item.propertyId,
      unitId: item.unitId,
      caseType: item.caseType,
      title: item.title,
      description: item.description,
      status: item.status,
      priority: item.priority,
      openedAt: item.openedAt,
      dueAt: item.dueAt,
      closedAt: item.closedAt,
      createdByUserId: item.createdByUserId,
      assignedUserId: item.assignedUserId,
      ownerVisibleStatus: item.ownerVisibleStatus,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }
}


import { Injectable } from "@nestjs/common";
import { WorkOrder } from "@prisma/client";

@Injectable()
export class WorkOrderMapper {
  static toResponse(item: WorkOrder) {
    return {
      id: item.id,
      caseId: item.caseId,
      vendorId: item.vendorId,
      workOrderNumber: item.workOrderNumber,
      description: item.description,
      status: item.status,
      scheduledFor: item.scheduledFor,
      completedAt: item.completedAt,
      slaDueAt: item.slaDueAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }
}


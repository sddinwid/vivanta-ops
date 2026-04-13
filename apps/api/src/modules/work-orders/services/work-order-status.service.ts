import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { WorkOrderStatus } from "@prisma/client";
import { AuditService } from "../../audit/services/audit.service";
import { WorkOrdersRepository } from "../repositories/work-orders.repository";

@Injectable()
export class WorkOrderStatusService {
  constructor(
    private readonly workOrdersRepository: WorkOrdersRepository,
    private readonly auditService: AuditService
  ) {}

  async schedule(params: {
    organizationId: string;
    actorUserId: string;
    workOrderId: string;
    scheduledFor: string;
    slaDueAt?: string;
    requestId?: string;
  }) {
    const { organizationId, actorUserId, workOrderId, scheduledFor, slaDueAt, requestId } =
      params;
    const item = await this.workOrdersRepository.findByIdScoped(
      workOrderId,
      organizationId
    );
    if (!item) {
      throw new NotFoundException("Work order not found");
    }
    if (item.status === WorkOrderStatus.CANCELLED) {
      throw new BadRequestException("Cannot schedule a cancelled work order");
    }

    const updated = await this.workOrdersRepository.update(workOrderId, {
      status: WorkOrderStatus.SCHEDULED,
      scheduledFor: new Date(scheduledFor),
      slaDueAt: slaDueAt ? new Date(slaDueAt) : undefined
    });
    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "workorder.schedule",
      entityType: "WorkOrder",
      entityId: workOrderId,
      oldValues: { status: item.status, scheduledFor: item.scheduledFor },
      newValues: { status: updated.status, scheduledFor: updated.scheduledFor },
      metadata: { requestId }
    });
    return updated;
  }

  async markComplete(params: {
    organizationId: string;
    actorUserId: string;
    workOrderId: string;
    note?: string;
    requestId?: string;
  }) {
    const { organizationId, actorUserId, workOrderId, note, requestId } = params;
    const item = await this.workOrdersRepository.findByIdScoped(
      workOrderId,
      organizationId
    );
    if (!item) {
      throw new NotFoundException("Work order not found");
    }
    if (item.status === WorkOrderStatus.CANCELLED) {
      throw new BadRequestException("Cannot complete a cancelled work order");
    }
    const updated = await this.workOrdersRepository.update(workOrderId, {
      status: WorkOrderStatus.COMPLETED,
      completedAt: new Date()
    });
    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "workorder.complete",
      entityType: "WorkOrder",
      entityId: workOrderId,
      oldValues: { status: item.status, completedAt: item.completedAt },
      newValues: { status: updated.status, completedAt: updated.completedAt },
      metadata: { requestId, note }
    });
    return updated;
  }

  async cancel(params: {
    organizationId: string;
    actorUserId: string;
    workOrderId: string;
    requestId?: string;
  }) {
    const { organizationId, actorUserId, workOrderId, requestId } = params;
    const item = await this.workOrdersRepository.findByIdScoped(
      workOrderId,
      organizationId
    );
    if (!item) {
      throw new NotFoundException("Work order not found");
    }
    if (item.status === WorkOrderStatus.COMPLETED) {
      throw new BadRequestException("Cannot cancel a completed work order");
    }
    const updated = await this.workOrdersRepository.update(workOrderId, {
      status: WorkOrderStatus.CANCELLED
    });
    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "workorder.cancel",
      entityType: "WorkOrder",
      entityId: workOrderId,
      oldValues: { status: item.status },
      newValues: { status: updated.status },
      metadata: { requestId }
    });
    return updated;
  }
}


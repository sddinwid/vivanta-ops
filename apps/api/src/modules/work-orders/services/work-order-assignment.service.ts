import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { AuditService } from "../../audit/services/audit.service";
import { WorkOrdersRepository } from "../repositories/work-orders.repository";

@Injectable()
export class WorkOrderAssignmentService {
  constructor(
    private readonly workOrdersRepository: WorkOrdersRepository,
    private readonly auditService: AuditService
  ) {}

  async assignVendor(params: {
    organizationId: string;
    actorUserId: string;
    workOrderId: string;
    vendorId: string | null;
    requestId?: string;
  }) {
    const { organizationId, actorUserId, workOrderId, vendorId, requestId } = params;
    const workOrder = await this.workOrdersRepository.findByIdScoped(
      workOrderId,
      organizationId
    );
    if (!workOrder) {
      throw new NotFoundException("Work order not found");
    }

    if (vendorId) {
      const vendor = await this.workOrdersRepository.findVendorInOrganization(
        vendorId,
        organizationId
      );
      if (!vendor) {
        throw new BadRequestException(
          "vendorId must belong to the same organization"
        );
      }
    }

    const updated = await this.workOrdersRepository.update(workOrderId, {
      vendorId
    });
    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "workorder.assign_vendor",
      entityType: "WorkOrder",
      entityId: workOrderId,
      oldValues: { vendorId: workOrder.vendorId },
      newValues: { vendorId: updated.vendorId },
      metadata: { requestId }
    });
    return updated;
  }
}


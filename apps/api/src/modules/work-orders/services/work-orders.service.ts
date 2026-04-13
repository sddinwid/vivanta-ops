import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, WorkOrderStatus } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { AuditService } from "../../audit/services/audit.service";
import { AssignWorkOrderVendorDto } from "../dto/assign-work-order-vendor.dto";
import { CreateWorkOrderDto } from "../dto/create-work-order.dto";
import { MarkWorkOrderCompleteDto } from "../dto/mark-work-order-complete.dto";
import { ScheduleWorkOrderDto } from "../dto/schedule-work-order.dto";
import { UpdateWorkOrderDto } from "../dto/update-work-order.dto";
import { WorkOrderFiltersDto } from "../dto/work-order-filters.dto";
import { WorkOrderMapper } from "../mappers/work-order.mapper";
import { WorkOrdersRepository } from "../repositories/work-orders.repository";
import { WorkOrderAssignmentService } from "./work-order-assignment.service";
import { WorkOrderStatusService } from "./work-order-status.service";

@Injectable()
export class WorkOrdersService {
  constructor(
    private readonly workOrdersRepository: WorkOrdersRepository,
    private readonly workOrderAssignmentService: WorkOrderAssignmentService,
    private readonly workOrderStatusService: WorkOrderStatusService,
    private readonly auditService: AuditService
  ) {}

  async list(organizationId: string, filters: WorkOrderFiltersDto) {
    const [data, total] = await Promise.all([
      this.workOrdersRepository.listByOrganization(organizationId, filters),
      this.workOrdersRepository.countByOrganization(organizationId, filters)
    ]);
    return {
      data: data.map(WorkOrderMapper.toResponse),
      meta: { total, limit: filters.limit ?? 25, offset: filters.offset ?? 0 }
    };
  }

  async getById(organizationId: string, workOrderId: string) {
    const item = await this.workOrdersRepository.findByIdScoped(
      workOrderId,
      organizationId
    );
    if (!item) {
      throw new NotFoundException("Work order not found");
    }
    return WorkOrderMapper.toResponse(item);
  }

  async createFromCase(params: {
    organizationId: string;
    actorUserId: string;
    caseId: string;
    dto: CreateWorkOrderDto;
    requestId?: string;
  }) {
    const { organizationId, actorUserId, caseId, dto, requestId } = params;
    const caseRef = await this.workOrdersRepository.findCaseInOrganization(
      caseId,
      organizationId
    );
    if (!caseRef) {
      throw new BadRequestException("caseId must belong to the same organization");
    }

    const workOrderNumber =
      dto.workOrderNumber ??
      (await this.generateWorkOrderNumber(caseId));

    try {
      const item = await this.workOrdersRepository.create({
        case: { connect: { id: caseId } },
        workOrderNumber,
        description: dto.description,
        status: WorkOrderStatus.OPEN,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
        slaDueAt: dto.slaDueAt ? new Date(dto.slaDueAt) : undefined
      });
      await this.auditService.record({
        organizationId,
        actorUserId,
        actionType: "workorder.create",
        entityType: "WorkOrder",
        entityId: item.id,
        newValues: WorkOrderMapper.toResponse(item),
        metadata: { requestId, caseId }
      });
      return WorkOrderMapper.toResponse(item);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new BadRequestException(
          "workOrderNumber already exists for this case"
        );
      }
      throw error;
    }
  }

  async update(params: {
    organizationId: string;
    actorUserId: string;
    workOrderId: string;
    dto: UpdateWorkOrderDto;
    requestId?: string;
  }) {
    const { organizationId, actorUserId, workOrderId, dto, requestId } = params;
    const existing = await this.workOrdersRepository.findByIdScoped(
      workOrderId,
      organizationId
    );
    if (!existing) {
      throw new NotFoundException("Work order not found");
    }
    if (dto.status) {
      throw new BadRequestException(
        "Use dedicated work order action endpoints for status changes"
      );
    }
    const updated = await this.workOrdersRepository.update(workOrderId, {
      description: dto.description,
      status: dto.status,
      scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : dto.scheduledFor === null ? null : undefined,
      slaDueAt: dto.slaDueAt ? new Date(dto.slaDueAt) : dto.slaDueAt === null ? null : undefined
    });
    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "workorder.update",
      entityType: "WorkOrder",
      entityId: workOrderId,
      oldValues: WorkOrderMapper.toResponse(existing),
      newValues: WorkOrderMapper.toResponse(updated),
      metadata: { requestId }
    });
    return WorkOrderMapper.toResponse(updated);
  }

  assignVendor(params: {
    organizationId: string;
    actorUserId: string;
    workOrderId: string;
    dto: AssignWorkOrderVendorDto;
    requestId?: string;
  }) {
    return this.workOrderAssignmentService
      .assignVendor({
        organizationId: params.organizationId,
        actorUserId: params.actorUserId,
        workOrderId: params.workOrderId,
        vendorId: params.dto.vendorId,
        requestId: params.requestId
      })
      .then(WorkOrderMapper.toResponse);
  }

  schedule(params: {
    organizationId: string;
    actorUserId: string;
    workOrderId: string;
    dto: ScheduleWorkOrderDto;
    requestId?: string;
  }) {
    return this.workOrderStatusService
      .schedule({
        organizationId: params.organizationId,
        actorUserId: params.actorUserId,
        workOrderId: params.workOrderId,
        scheduledFor: params.dto.scheduledFor,
        slaDueAt: params.dto.slaDueAt,
        requestId: params.requestId
      })
      .then(WorkOrderMapper.toResponse);
  }

  markComplete(params: {
    organizationId: string;
    actorUserId: string;
    workOrderId: string;
    dto: MarkWorkOrderCompleteDto;
    requestId?: string;
  }) {
    return this.workOrderStatusService
      .markComplete({
        organizationId: params.organizationId,
        actorUserId: params.actorUserId,
        workOrderId: params.workOrderId,
        note: params.dto.note,
        requestId: params.requestId
      })
      .then(WorkOrderMapper.toResponse);
  }

  cancel(params: {
    organizationId: string;
    actorUserId: string;
    workOrderId: string;
    requestId?: string;
  }) {
    return this.workOrderStatusService
      .cancel({
        organizationId: params.organizationId,
        actorUserId: params.actorUserId,
        workOrderId: params.workOrderId,
        requestId: params.requestId
      })
      .then(WorkOrderMapper.toResponse);
  }

  private async generateWorkOrderNumber(caseId: string): Promise<string> {
    const count = await this.workOrdersRepository.nextWorkOrderNumberSeed(caseId);
    const suffix = `${count + 1}`.padStart(3, "0");
    return `WO-${caseId.slice(0, 8)}-${suffix}-${randomUUID().slice(0, 4).toUpperCase()}`;
  }
}

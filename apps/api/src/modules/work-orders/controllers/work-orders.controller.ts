import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequestIdentity } from "../../../common/request-context/request-context.types";
import { AssignWorkOrderVendorDto } from "../dto/assign-work-order-vendor.dto";
import { CreateWorkOrderDto } from "../dto/create-work-order.dto";
import { MarkWorkOrderCompleteDto } from "../dto/mark-work-order-complete.dto";
import { ScheduleWorkOrderDto } from "../dto/schedule-work-order.dto";
import { UpdateWorkOrderDto } from "../dto/update-work-order.dto";
import { WorkOrderFiltersDto } from "../dto/work-order-filters.dto";
import { WorkOrdersService } from "../services/work-orders.service";

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Get("work-orders")
  @RequirePermissions("workorder.read")
  list(
    @CurrentUser() identity: RequestIdentity,
    @Query() filters: WorkOrderFiltersDto
  ): Promise<unknown> {
    return this.workOrdersService.list(identity.organizationId, filters);
  }

  @Post("cases/:caseId/work-orders")
  @RequirePermissions("workorder.write")
  createFromCase(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("caseId", new ParseUUIDPipe()) caseId: string,
    @Body() dto: CreateWorkOrderDto
  ): Promise<unknown> {
    return this.workOrdersService.createFromCase({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      caseId,
      dto,
      requestId: req.requestId
    });
  }

  @Get("work-orders/:workOrderId")
  @RequirePermissions("workorder.read")
  getById(
    @CurrentUser() identity: RequestIdentity,
    @Param("workOrderId", new ParseUUIDPipe()) workOrderId: string
  ): Promise<unknown> {
    return this.workOrdersService.getById(identity.organizationId, workOrderId);
  }

  @Patch("work-orders/:workOrderId")
  @RequirePermissions("workorder.write")
  update(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("workOrderId", new ParseUUIDPipe()) workOrderId: string,
    @Body() dto: UpdateWorkOrderDto
  ): Promise<unknown> {
    return this.workOrdersService.update({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      workOrderId,
      dto,
      requestId: req.requestId
    });
  }

  @Post("work-orders/:workOrderId/assign-vendor")
  @RequirePermissions("workorder.assign")
  assignVendor(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("workOrderId", new ParseUUIDPipe()) workOrderId: string,
    @Body() dto: AssignWorkOrderVendorDto
  ): Promise<unknown> {
    return this.workOrdersService.assignVendor({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      workOrderId,
      dto,
      requestId: req.requestId
    });
  }

  @Post("work-orders/:workOrderId/schedule")
  @RequirePermissions("workorder.write")
  schedule(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("workOrderId", new ParseUUIDPipe()) workOrderId: string,
    @Body() dto: ScheduleWorkOrderDto
  ): Promise<unknown> {
    return this.workOrdersService.schedule({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      workOrderId,
      dto,
      requestId: req.requestId
    });
  }

  @Post("work-orders/:workOrderId/mark-complete")
  @RequirePermissions("workorder.write")
  markComplete(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("workOrderId", new ParseUUIDPipe()) workOrderId: string,
    @Body() dto: MarkWorkOrderCompleteDto
  ): Promise<unknown> {
    return this.workOrdersService.markComplete({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      workOrderId,
      dto,
      requestId: req.requestId
    });
  }

  @Post("work-orders/:workOrderId/cancel")
  @RequirePermissions("workorder.write")
  cancel(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("workOrderId", new ParseUUIDPipe()) workOrderId: string
  ): Promise<unknown> {
    return this.workOrdersService.cancel({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      workOrderId,
      requestId: req.requestId
    });
  }
}


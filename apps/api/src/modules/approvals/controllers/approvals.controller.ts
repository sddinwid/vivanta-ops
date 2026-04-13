import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
import { ApprovalDecisionDto } from "../dto/approval-decision.dto";
import { ApprovalFiltersDto } from "../dto/approval-filters.dto";
import { ApprovalsService } from "../services/approvals.service";

@Controller("approval-flows")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get()
  @RequirePermissions("approval.read")
  list(
    @CurrentUser() identity: RequestIdentity,
    @Query() filters: ApprovalFiltersDto
  ): Promise<unknown> {
    return this.approvalsService.list(identity.organizationId, filters);
  }

  @Get(":flowId")
  @RequirePermissions("approval.read")
  getById(
    @CurrentUser() identity: RequestIdentity,
    @Param("flowId", new ParseUUIDPipe()) flowId: string
  ): Promise<unknown> {
    return this.approvalsService.getById(identity.organizationId, flowId);
  }

  @Get(":flowId/steps")
  @RequirePermissions("approval.read")
  getSteps(
    @CurrentUser() identity: RequestIdentity,
    @Param("flowId", new ParseUUIDPipe()) flowId: string
  ): Promise<unknown> {
    return this.approvalsService.getSteps(identity.organizationId, flowId);
  }

  @Post(":flowId/approve")
  @RequirePermissions("invoice.approve", "approval.write")
  approve(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("flowId", new ParseUUIDPipe()) flowId: string,
    @Body() dto: ApprovalDecisionDto
  ): Promise<unknown> {
    return this.approvalsService.approve(
      identity.organizationId,
      identity.userId,
      flowId,
      dto,
      req.requestId
    );
  }

  @Post(":flowId/reject")
  @RequirePermissions("invoice.approve", "approval.write")
  reject(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("flowId", new ParseUUIDPipe()) flowId: string,
    @Body() dto: ApprovalDecisionDto
  ): Promise<unknown> {
    return this.approvalsService.reject(
      identity.organizationId,
      identity.userId,
      flowId,
      dto,
      req.requestId
    );
  }

  @Post(":flowId/request-changes")
  @RequirePermissions("invoice.approve", "approval.write")
  requestChanges(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("flowId", new ParseUUIDPipe()) flowId: string,
    @Body() dto: ApprovalDecisionDto
  ): Promise<unknown> {
    return this.approvalsService.requestChanges(
      identity.organizationId,
      identity.userId,
      flowId,
      dto,
      req.requestId
    );
  }
}

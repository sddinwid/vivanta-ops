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
import { CancelWorkflowDto } from "../dto/cancel-workflow.dto";
import { RetryWorkflowDto } from "../dto/retry-workflow.dto";
import { WorkflowFiltersDto } from "../dto/workflow-filters.dto";
import { WorkflowsService } from "../services/workflows.service";

@Controller("workflows")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get("runs")
  @RequirePermissions("workflow.read")
  listRuns(
    @CurrentUser() identity: RequestIdentity,
    @Query() filters: WorkflowFiltersDto
  ): Promise<unknown> {
    return this.workflowsService.listRuns(identity.organizationId, filters);
  }

  @Get("runs/:workflowRunId")
  @RequirePermissions("workflow.read")
  getRunById(
    @CurrentUser() identity: RequestIdentity,
    @Param("workflowRunId", new ParseUUIDPipe()) workflowRunId: string
  ): Promise<unknown> {
    return this.workflowsService.getRunById(identity.organizationId, workflowRunId);
  }

  @Get("runs/:workflowRunId/events")
  @RequirePermissions("workflow.read")
  listRunEvents(
    @CurrentUser() identity: RequestIdentity,
    @Param("workflowRunId", new ParseUUIDPipe()) workflowRunId: string
  ): Promise<unknown> {
    return this.workflowsService.listRunEvents(identity.organizationId, workflowRunId);
  }

  @Post("runs/:workflowRunId/retry")
  @RequirePermissions("workflow.write")
  retryRun(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("workflowRunId", new ParseUUIDPipe()) workflowRunId: string,
    @Body() dto: RetryWorkflowDto
  ): Promise<unknown> {
    return this.workflowsService.retryRun({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      workflowRunId,
      dto,
      requestId: req.requestId
    });
  }

  @Post("runs/:workflowRunId/cancel")
  @RequirePermissions("workflow.write")
  cancelRun(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("workflowRunId", new ParseUUIDPipe()) workflowRunId: string,
    @Body() dto: CancelWorkflowDto
  ): Promise<unknown> {
    return this.workflowsService.cancelRun({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      workflowRunId,
      dto,
      requestId: req.requestId
    });
  }
}

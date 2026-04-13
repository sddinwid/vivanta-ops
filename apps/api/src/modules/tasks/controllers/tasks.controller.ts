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
import { AssignTaskDto } from "../dto/assign-task.dto";
import { ChangeTaskStatusDto } from "../dto/change-task-status.dto";
import { CreateTaskDto } from "../dto/create-task.dto";
import { TaskFiltersDto } from "../dto/task-filters.dto";
import { UpdateTaskDto } from "../dto/update-task.dto";
import { TasksService } from "../services/tasks.service";

@Controller("tasks")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @RequirePermissions("task.read")
  list(
    @CurrentUser() identity: RequestIdentity,
    @Query() filters: TaskFiltersDto
  ): Promise<unknown> {
    return this.tasksService.list(identity.organizationId, filters);
  }

  @Post()
  @RequirePermissions("task.write")
  create(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Body() dto: CreateTaskDto
  ): Promise<unknown> {
    return this.tasksService.create({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      dto,
      requestId: req.requestId
    });
  }

  @Get("queues/my-work")
  @RequirePermissions("task.read")
  queueMyWork(@CurrentUser() identity: RequestIdentity): Promise<unknown> {
    return this.tasksService.queueMyWork(identity.organizationId, identity.userId);
  }

  @Get("queues/review")
  @RequirePermissions("task.read")
  queueReview(@CurrentUser() identity: RequestIdentity): Promise<unknown> {
    return this.tasksService.queueReview(identity.organizationId);
  }

  @Get(":taskId")
  @RequirePermissions("task.read")
  getById(
    @CurrentUser() identity: RequestIdentity,
    @Param("taskId", new ParseUUIDPipe()) taskId: string
  ): Promise<unknown> {
    return this.tasksService.getById(identity.organizationId, taskId);
  }

  @Patch(":taskId")
  @RequirePermissions("task.write")
  update(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("taskId", new ParseUUIDPipe()) taskId: string,
    @Body() dto: UpdateTaskDto
  ): Promise<unknown> {
    return this.tasksService.update({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      taskId,
      dto,
      requestId: req.requestId
    });
  }

  @Post(":taskId/assign")
  @RequirePermissions("task.write")
  assign(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("taskId", new ParseUUIDPipe()) taskId: string,
    @Body() dto: AssignTaskDto
  ): Promise<unknown> {
    return this.tasksService.assign({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      taskId,
      dto,
      requestId: req.requestId
    });
  }

  @Post(":taskId/change-status")
  @RequirePermissions("task.write")
  changeStatus(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("taskId", new ParseUUIDPipe()) taskId: string,
    @Body() dto: ChangeTaskStatusDto
  ): Promise<unknown> {
    return this.tasksService.changeStatus({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      taskId,
      dto,
      requestId: req.requestId
    });
  }
}


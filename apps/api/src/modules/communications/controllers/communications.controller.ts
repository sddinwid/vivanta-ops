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
import { AssignThreadDto } from "../dto/assign-thread.dto";
import { CommunicationFiltersDto } from "../dto/communication-filters.dto";
import { CreateMessageDto } from "../dto/create-message.dto";
import { CreateThreadDto } from "../dto/create-thread.dto";
import { LinkThreadDto } from "../dto/link-thread.dto";
import { UpdateThreadDto } from "../dto/update-thread.dto";
import { CommunicationsService } from "../services/communications.service";

@Controller("communications")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CommunicationsController {
  constructor(private readonly communicationsService: CommunicationsService) {}

  @Get("threads")
  @RequirePermissions("communication.read")
  listThreads(
    @CurrentUser() identity: RequestIdentity,
    @Query() filters: CommunicationFiltersDto
  ): Promise<unknown> {
    return this.communicationsService.listThreads(identity.organizationId, filters);
  }

  @Post("threads")
  @RequirePermissions("communication.write")
  createThread(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Body() dto: CreateThreadDto
  ): Promise<unknown> {
    return this.communicationsService.createThread({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      dto,
      requestId: req.requestId
    });
  }

  @Get("threads/:threadId")
  @RequirePermissions("communication.read")
  getThread(
    @CurrentUser() identity: RequestIdentity,
    @Param("threadId", new ParseUUIDPipe()) threadId: string
  ): Promise<unknown> {
    return this.communicationsService.getThreadById(
      identity.organizationId,
      threadId
    );
  }

  @Patch("threads/:threadId")
  @RequirePermissions("communication.write")
  updateThread(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("threadId", new ParseUUIDPipe()) threadId: string,
    @Body() dto: UpdateThreadDto
  ): Promise<unknown> {
    return this.communicationsService.updateThread({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      threadId,
      dto,
      requestId: req.requestId
    });
  }

  @Post("threads/:threadId/assign")
  @RequirePermissions("communication.assign")
  assignThread(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("threadId", new ParseUUIDPipe()) threadId: string,
    @Body() dto: AssignThreadDto
  ): Promise<unknown> {
    return this.communicationsService.assignThread({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      threadId,
      dto,
      requestId: req.requestId
    });
  }

  @Post("threads/:threadId/link")
  @RequirePermissions("communication.write")
  linkThread(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("threadId", new ParseUUIDPipe()) threadId: string,
    @Body() dto: LinkThreadDto
  ): Promise<unknown> {
    return this.communicationsService.linkThread({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      threadId,
      dto,
      requestId: req.requestId
    });
  }

  @Get("threads/:threadId/messages")
  @RequirePermissions("communication.read")
  listMessages(
    @CurrentUser() identity: RequestIdentity,
    @Param("threadId", new ParseUUIDPipe()) threadId: string
  ): Promise<unknown> {
    return this.communicationsService.listMessages(identity.organizationId, threadId);
  }

  @Post("threads/:threadId/messages")
  @RequirePermissions("communication.write")
  createMessage(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("threadId", new ParseUUIDPipe()) threadId: string,
    @Body() dto: CreateMessageDto
  ): Promise<unknown> {
    return this.communicationsService.createMessage({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      threadId,
      dto,
      requestId: req.requestId
    });
  }

  @Get("queues/inbox")
  @RequirePermissions("communication.read")
  queueInbox(@CurrentUser() identity: RequestIdentity): Promise<unknown> {
    return this.communicationsService.queueInbox(identity.organizationId);
  }

  @Get("queues/unassigned")
  @RequirePermissions("communication.read")
  queueUnassigned(@CurrentUser() identity: RequestIdentity): Promise<unknown> {
    return this.communicationsService.queueUnassigned(identity.organizationId);
  }

  @Get("queues/urgent")
  @RequirePermissions("communication.read")
  queueUrgent(@CurrentUser() identity: RequestIdentity): Promise<unknown> {
    return this.communicationsService.queueUrgent(identity.organizationId);
  }
}


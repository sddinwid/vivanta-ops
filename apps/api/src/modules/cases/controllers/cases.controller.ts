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
import { AssignCaseDto } from "../dto/assign-case.dto";
import { CaseFiltersDto } from "../dto/case-filters.dto";
import { ChangeCaseStatusDto } from "../dto/change-case-status.dto";
import { CreateCaseDto } from "../dto/create-case.dto";
import { UpdateCaseDto } from "../dto/update-case.dto";
import { CasesService } from "../services/cases.service";

@Controller("cases")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get()
  @RequirePermissions("case.read")
  list(
    @CurrentUser() identity: RequestIdentity,
    @Query() filters: CaseFiltersDto
  ): Promise<unknown> {
    return this.casesService.list(identity.organizationId, filters);
  }

  @Post()
  @RequirePermissions("case.write")
  create(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Body() dto: CreateCaseDto
  ): Promise<unknown> {
    return this.casesService.create({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      dto,
      requestId: req.requestId
    });
  }

  @Get("queues/open")
  @RequirePermissions("case.read")
  queueOpen(@CurrentUser() identity: RequestIdentity): Promise<unknown> {
    return this.casesService.queueOpen(identity.organizationId);
  }

  @Get("queues/escalated")
  @RequirePermissions("case.read")
  queueEscalated(@CurrentUser() identity: RequestIdentity): Promise<unknown> {
    return this.casesService.queueEscalated(identity.organizationId);
  }

  @Get("queues/waiting")
  @RequirePermissions("case.read")
  queueWaiting(@CurrentUser() identity: RequestIdentity): Promise<unknown> {
    return this.casesService.queueWaiting(identity.organizationId);
  }

  @Get(":caseId")
  @RequirePermissions("case.read")
  getById(
    @CurrentUser() identity: RequestIdentity,
    @Param("caseId", new ParseUUIDPipe()) caseId: string
  ): Promise<unknown> {
    return this.casesService.getById(identity.organizationId, caseId);
  }

  @Patch(":caseId")
  @RequirePermissions("case.write")
  update(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("caseId", new ParseUUIDPipe()) caseId: string,
    @Body() dto: UpdateCaseDto
  ): Promise<unknown> {
    return this.casesService.update({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      caseId,
      dto,
      requestId: req.requestId
    });
  }

  @Post(":caseId/assign")
  @RequirePermissions("case.assign")
  assign(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("caseId", new ParseUUIDPipe()) caseId: string,
    @Body() dto: AssignCaseDto
  ): Promise<unknown> {
    return this.casesService.assign({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      caseId,
      dto,
      requestId: req.requestId
    });
  }

  @Post(":caseId/change-status")
  @RequirePermissions("case.write")
  changeStatus(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("caseId", new ParseUUIDPipe()) caseId: string,
    @Body() dto: ChangeCaseStatusDto
  ): Promise<unknown> {
    return this.casesService.changeStatus({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      caseId,
      dto,
      requestId: req.requestId
    });
  }
}

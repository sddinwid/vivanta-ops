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
import { AiRunFiltersDto } from "../dto/ai-run-filters.dto";
import { ApplyAiSuggestionDto } from "../dto/apply-ai-suggestion.dto";
import { CreateAiRunDto } from "../dto/create-ai-run.dto";
import { CreatePromptTemplateDto } from "../dto/create-prompt-template.dto";
import { CreateProviderConfigDto } from "../dto/create-provider-config.dto";
import { UpdatePromptTemplateDto } from "../dto/update-prompt-template.dto";
import { UpdateProviderConfigDto } from "../dto/update-provider-config.dto";
import { AiService } from "../services/ai.service";

@Controller("ai")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get("runs")
  @RequirePermissions("ai.read")
  listRuns(
    @CurrentUser() identity: RequestIdentity,
    @Query() filters: AiRunFiltersDto
  ): Promise<unknown> {
    return this.aiService.listRuns(identity.organizationId, filters);
  }

  @Get("runs/:aiRunId")
  @RequirePermissions("ai.read")
  getRunById(
    @CurrentUser() identity: RequestIdentity,
    @Param("aiRunId", new ParseUUIDPipe()) aiRunId: string
  ): Promise<unknown> {
    return this.aiService.getRunById(identity.organizationId, aiRunId);
  }

  @Get("runs/:aiRunId/suggestions")
  @RequirePermissions("ai.read")
  listRunSuggestions(
    @CurrentUser() identity: RequestIdentity,
    @Param("aiRunId", new ParseUUIDPipe()) aiRunId: string
  ): Promise<unknown> {
    return this.aiService.listRunSuggestions(identity.organizationId, aiRunId);
  }

  @Post("runs")
  @RequirePermissions("ai.write")
  createRun(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Body() dto: CreateAiRunDto
  ): Promise<unknown> {
    return this.aiService.createRun({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      dto,
      requestId: req.requestId
    });
  }

  @Get("prompt-templates")
  @RequirePermissions("ai.read")
  listPromptTemplates(): Promise<unknown> {
    return this.aiService.listPromptTemplates();
  }

  @Post("prompt-templates")
  @RequirePermissions("ai.admin")
  createPromptTemplate(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Body() dto: CreatePromptTemplateDto
  ): Promise<unknown> {
    return this.aiService.createPromptTemplate({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      dto,
      requestId: req.requestId
    });
  }

  @Patch("prompt-templates/:templateId")
  @RequirePermissions("ai.admin")
  updatePromptTemplate(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("templateId", new ParseUUIDPipe()) templateId: string,
    @Body() dto: UpdatePromptTemplateDto
  ): Promise<unknown> {
    return this.aiService.updatePromptTemplate({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      templateId,
      dto,
      requestId: req.requestId
    });
  }

  @Get("provider-configs")
  @RequirePermissions("ai.read")
  listProviderConfigs(@CurrentUser() identity: RequestIdentity): Promise<unknown> {
    return this.aiService.listProviderConfigs(identity.organizationId);
  }

  @Post("provider-configs")
  @RequirePermissions("ai.admin")
  createProviderConfig(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Body() dto: CreateProviderConfigDto
  ): Promise<unknown> {
    return this.aiService.createProviderConfig({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      dto,
      requestId: req.requestId
    });
  }

  @Patch("provider-configs/:configId")
  @RequirePermissions("ai.admin")
  updateProviderConfig(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("configId", new ParseUUIDPipe()) configId: string,
    @Body() dto: UpdateProviderConfigDto
  ): Promise<unknown> {
    return this.aiService.updateProviderConfig({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      configId,
      dto,
      requestId: req.requestId
    });
  }

  @Post("suggestions/:suggestionId/apply")
  @RequirePermissions("ai.write")
  applySuggestion(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("suggestionId", new ParseUUIDPipe()) suggestionId: string,
    @Body() dto: ApplyAiSuggestionDto
  ): Promise<unknown> {
    return this.aiService.applySuggestion({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      suggestionId,
      dto,
      requestId: req.requestId
    });
  }
}

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
import { RequireAnyPermissions } from "../../../common/decorators/require-any-permissions.decorator";
import { RequirePermissions } from "../../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequestIdentity } from "../../../common/request-context/request-context.types";
import { AiPromptTemplateFiltersDto } from "../dto/ai-prompt-template-filters.dto";
import { AiRunFiltersDto } from "../dto/ai-run-filters.dto";
import { AiRunSummaryFiltersDto } from "../dto/ai-run-summary-filters.dto";
import { ApplyAiSuggestionDto } from "../dto/apply-ai-suggestion.dto";
import { AiSuggestionFiltersDto } from "../dto/ai-suggestion-filters.dto";
import { CreateAiRunDto } from "../dto/create-ai-run.dto";
import { CreateAiEvaluationDto } from "../dto/create-ai-evaluation.dto";
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
  @RequireAnyPermissions("ai.read", "ai.observe")
  listRuns(
    @CurrentUser() identity: RequestIdentity,
    @Query() filters: AiRunFiltersDto
  ): Promise<unknown> {
    return this.aiService.listRuns(identity.organizationId, filters);
  }

  @Get("runs/summary")
  @RequireAnyPermissions("ai.read", "ai.observe")
  runsSummary(
    @CurrentUser() identity: RequestIdentity,
    @Query() filters: AiRunSummaryFiltersDto
  ): Promise<unknown> {
    return this.aiService.getRunsSummary(identity.organizationId, filters);
  }

  @Get("runs/:aiRunId")
  @RequireAnyPermissions("ai.read", "ai.observe")
  getRunById(
    @CurrentUser() identity: RequestIdentity,
    @Param("aiRunId", new ParseUUIDPipe()) aiRunId: string
  ): Promise<unknown> {
    return this.aiService.getRunById(identity.organizationId, aiRunId);
  }

  @Get("runs/:aiRunId/evaluations")
  @RequireAnyPermissions("ai.read", "ai.observe")
  listRunEvaluations(
    @CurrentUser() identity: RequestIdentity,
    @Param("aiRunId", new ParseUUIDPipe()) aiRunId: string
  ): Promise<unknown> {
    return this.aiService.listRunEvaluations(identity.organizationId, aiRunId);
  }

  @Post("runs/:aiRunId/evaluations")
  @RequirePermissions("ai.evaluate")
  createRunEvaluation(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("aiRunId", new ParseUUIDPipe()) aiRunId: string,
    @Body() dto: CreateAiEvaluationDto
  ): Promise<unknown> {
    return this.aiService.createRunEvaluation({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      aiRunId,
      dto,
      requestId: req.requestId
    });
  }

  @Get("runs/:aiRunId/suggestions")
  @RequireAnyPermissions("ai.read", "ai.observe")
  listRunSuggestions(
    @CurrentUser() identity: RequestIdentity,
    @Param("aiRunId", new ParseUUIDPipe()) aiRunId: string
  ): Promise<unknown> {
    return this.aiService.listRunSuggestions(identity.organizationId, aiRunId);
  }

  @Get("suggestions")
  @RequireAnyPermissions("ai.read", "ai.observe")
  listSuggestions(
    @CurrentUser() identity: RequestIdentity,
    @Query() filters: AiSuggestionFiltersDto
  ): Promise<unknown> {
    return this.aiService.listSuggestions(identity.organizationId, filters);
  }

  @Get("suggestions/:suggestionId")
  @RequireAnyPermissions("ai.read", "ai.observe")
  getSuggestionById(
    @CurrentUser() identity: RequestIdentity,
    @Param("suggestionId", new ParseUUIDPipe()) suggestionId: string
  ): Promise<unknown> {
    return this.aiService.getSuggestionById(identity.organizationId, suggestionId);
  }

  @Post("suggestions/:suggestionId/evaluations")
  @RequirePermissions("ai.evaluate")
  createSuggestionEvaluation(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("suggestionId", new ParseUUIDPipe()) suggestionId: string,
    @Body() dto: CreateAiEvaluationDto
  ): Promise<unknown> {
    return this.aiService.createSuggestionEvaluation({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      suggestionId,
      dto,
      requestId: req.requestId
    });
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
  @RequirePermissions("ai.admin")
  listPromptTemplates(@Query() filters: AiPromptTemplateFiltersDto): Promise<unknown> {
    return this.aiService.listPromptTemplates(filters);
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
  @RequirePermissions("ai.admin")
  listProviderConfigs(@CurrentUser() identity: RequestIdentity): Promise<unknown> {
    return this.aiService.listProviderConfigs(identity.organizationId);
  }

  @Get("capabilities")
  @RequireAnyPermissions("ai.read", "ai.observe")
  listCapabilities(@CurrentUser() identity: RequestIdentity): Promise<unknown> {
    return this.aiService.listCapabilities(identity.organizationId);
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

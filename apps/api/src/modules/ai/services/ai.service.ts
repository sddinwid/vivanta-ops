import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from "@nestjs/common";
import {
  AiCapability,
  AiRunStatus,
  AiSuggestionType,
  Prisma
} from "@prisma/client";
import { AuditService } from "../../audit/services/audit.service";
import { AiRunFiltersDto } from "../dto/ai-run-filters.dto";
import { ApplyAiSuggestionDto } from "../dto/apply-ai-suggestion.dto";
import { CreateAiRunDto } from "../dto/create-ai-run.dto";
import { CreatePromptTemplateDto } from "../dto/create-prompt-template.dto";
import { CreateProviderConfigDto } from "../dto/create-provider-config.dto";
import { UpdatePromptTemplateDto } from "../dto/update-prompt-template.dto";
import { UpdateProviderConfigDto } from "../dto/update-provider-config.dto";
import { AiRunMapper } from "../mappers/ai-run.mapper";
import { AiRunsRepository } from "../repositories/ai-runs.repository";
import { AiSuggestionsRepository } from "../repositories/ai-suggestions.repository";
import { AiPromptService } from "./ai-prompt.service";
import { AiProviderService } from "./ai-provider.service";
import { AiSuggestionService } from "./ai-suggestion.service";

const VALID_SUGGESTION_TYPES = new Set<string>(Object.values(AiSuggestionType));

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly aiRunsRepository: AiRunsRepository,
    private readonly aiSuggestionsRepository: AiSuggestionsRepository,
    private readonly aiProviderService: AiProviderService,
    private readonly aiPromptService: AiPromptService,
    private readonly aiSuggestionService: AiSuggestionService,
    private readonly auditService: AuditService
  ) {}

  async listRuns(organizationId: string, filters: AiRunFiltersDto) {
    const [runs, total] = await Promise.all([
      this.aiRunsRepository.listByOrganization(organizationId, filters),
      this.aiRunsRepository.countByOrganization(organizationId, filters)
    ]);

    return {
      data: runs.map(AiRunMapper.toResponse),
      meta: {
        total,
        limit: filters.limit ?? 25,
        offset: filters.offset ?? 0
      }
    };
  }

  async getRunById(organizationId: string, aiRunId: string) {
    const run = await this.aiRunsRepository.findByIdScoped(aiRunId, organizationId);
    if (!run) {
      throw new NotFoundException("AI run not found");
    }
    return AiRunMapper.toResponse(run);
  }

  listRunSuggestions(organizationId: string, aiRunId: string) {
    return this.aiSuggestionService.listRunSuggestions(organizationId, aiRunId);
  }

  async createRun(params: {
    organizationId: string;
    actorUserId: string;
    dto: CreateAiRunDto;
    requestId?: string;
  }) {
    const { organizationId, actorUserId, dto, requestId } = params;

    if (
      (dto.targetEntityType && !dto.targetEntityId) ||
      (!dto.targetEntityType && dto.targetEntityId)
    ) {
      throw new BadRequestException(
        "targetEntityType and targetEntityId must be provided together"
      );
    }

    if (dto.targetEntityType && dto.targetEntityId) {
      const exists = await this.aiRunsRepository.findEntityInOrganization(
        organizationId,
        dto.targetEntityType,
        dto.targetEntityId
      );
      if (!exists) {
        throw new BadRequestException(
          "targetEntityType/targetEntityId must reference an entity in the same organization"
        );
      }
    }

    const promptTemplate = await this.aiPromptService.resolvePromptTemplate({
      capability: dto.capability,
      templateId: dto.promptTemplateId
    });

    const providerConfig = await this.aiProviderService.resolvePreferredConfig(
      organizationId,
      dto.capability
    );

    const providerName = providerConfig?.providerName ?? "stub";
    const modelName = providerConfig?.modelName ?? "stub-v1";

    const created = await this.aiRunsRepository.create({
      organization: { connect: { id: organizationId } },
      capability: dto.capability,
      providerName,
      modelName,
      promptTemplate: promptTemplate ? { connect: { id: promptTemplate.id } } : undefined,
      targetEntityType: dto.targetEntityType,
      targetEntityId: dto.targetEntityId,
      status: AiRunStatus.PENDING,
      inputJson: dto.inputJson,
      createdByUser: { connect: { id: actorUserId } }
    });

    await this.aiRunsRepository.update(created.id, {
      status: AiRunStatus.RUNNING
    });

    try {
      const providerResponse = await this.aiProviderService.run({
        capability: dto.capability,
        systemPrompt: promptTemplate?.systemPrompt ?? this.defaultSystemPrompt(dto.capability),
        userPrompt: this.renderUserPrompt(promptTemplate?.userPromptTemplate, dto.inputJson),
        input: dto.inputJson ?? null,
        settings: (providerConfig?.settingsJson as Record<string, unknown> | null) ?? null,
        providerName,
        modelName
      });

      await this.aiRunsRepository.update(created.id, {
        status: AiRunStatus.COMPLETED,
        outputJson: providerResponse.output,
        confidenceScore: providerResponse.confidenceScore,
        latencyMs: providerResponse.latencyMs,
        completedAt: new Date()
      });

      if (dto.createSuggestions) {
        const suggestions = this.extractSuggestions(
          created.id,
          dto,
          providerResponse.output,
          dto.suggestionType ?? AiSuggestionType.GENERIC
        );
        if (suggestions.length > 0) {
          await this.aiSuggestionsRepository.createMany(suggestions);
        }
      }

      const finalRun = await this.aiRunsRepository.findByIdScoped(created.id, organizationId);
      if (!finalRun) {
        throw new NotFoundException("AI run not found after completion");
      }

      await this.auditService.record({
        organizationId,
        actorUserId,
        actionType: "ai.run.create",
        entityType: "AiRun",
        entityId: created.id,
        newValues: AiRunMapper.toResponse(finalRun),
        metadata: { requestId }
      });

      return AiRunMapper.toResponse(finalRun);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown AI provider error";
      this.logger.error(`AI run failed: ${message}`);
      await this.aiRunsRepository.update(created.id, {
        status: AiRunStatus.FAILED,
        errorCode: "AI_PROVIDER_ERROR",
        errorMessage: message,
        completedAt: new Date()
      });
      throw new InternalServerErrorException("AI run failed");
    }
  }

  listPromptTemplates() {
    return this.aiPromptService.listTemplates().then((templates) => ({
      data: templates,
      meta: { total: templates.length }
    }));
  }

  async createPromptTemplate(params: {
    organizationId: string;
    actorUserId: string;
    dto: CreatePromptTemplateDto;
    requestId?: string;
  }) {
    const template = await this.aiPromptService.createTemplate(params.dto);
    await this.auditService.record({
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      actionType: "ai.prompt_template.create",
      entityType: "AiPromptTemplate",
      entityId: template.id,
      newValues: template,
      metadata: { requestId: params.requestId }
    });
    return template;
  }

  async updatePromptTemplate(params: {
    organizationId: string;
    actorUserId: string;
    templateId: string;
    dto: UpdatePromptTemplateDto;
    requestId?: string;
  }) {
    const template = await this.aiPromptService.updateTemplate(
      params.templateId,
      params.dto
    );
    await this.auditService.record({
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      actionType: "ai.prompt_template.update",
      entityType: "AiPromptTemplate",
      entityId: template.id,
      newValues: template,
      metadata: { requestId: params.requestId }
    });
    return template;
  }

  listProviderConfigs(organizationId: string) {
    return this.aiProviderService.listConfigs(organizationId).then((configs) => ({
      data: configs,
      meta: { total: configs.length }
    }));
  }

  async createProviderConfig(params: {
    organizationId: string;
    actorUserId: string;
    dto: CreateProviderConfigDto;
    requestId?: string;
  }) {
    if (
      params.dto.organizationId &&
      params.dto.organizationId !== params.organizationId
    ) {
      throw new BadRequestException(
        "organizationId must match authenticated organization when provided"
      );
    }

    const config = await this.aiProviderService.createConfig(params.dto);
    await this.auditService.record({
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      actionType: "ai.provider_config.create",
      entityType: "AiProviderConfig",
      entityId: config.id,
      newValues: config,
      metadata: { requestId: params.requestId }
    });
    return config;
  }

  async updateProviderConfig(params: {
    organizationId: string;
    actorUserId: string;
    configId: string;
    dto: UpdateProviderConfigDto;
    requestId?: string;
  }) {
    if (
      params.dto.organizationId &&
      params.dto.organizationId !== params.organizationId
    ) {
      throw new BadRequestException(
        "organizationId must match authenticated organization when provided"
      );
    }

    const config = await this.aiProviderService.updateConfig(params.configId, params.dto);
    await this.auditService.record({
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      actionType: "ai.provider_config.update",
      entityType: "AiProviderConfig",
      entityId: config.id,
      newValues: config,
      metadata: { requestId: params.requestId }
    });
    return config;
  }

  async applySuggestion(params: {
    organizationId: string;
    actorUserId: string;
    suggestionId: string;
    dto: ApplyAiSuggestionDto;
    requestId?: string;
  }) {
    const result = await this.aiSuggestionService.applySuggestion({
      organizationId: params.organizationId,
      suggestionId: params.suggestionId,
      appliedByUserId: params.actorUserId,
      dto: params.dto
    });

    if (result.appliedNow) {
      await this.auditService.record({
        organizationId: params.organizationId,
        actorUserId: params.actorUserId,
        actionType: "ai.suggestion.apply",
        entityType: "AiSuggestion",
        entityId: params.suggestionId,
        newValues: result.suggestion,
        metadata: {
          requestId: params.requestId,
          note: params.dto.note,
          applicationMetadata: params.dto.applicationMetadata
        }
      });
    }

    return result;
  }

  private defaultSystemPrompt(capability: AiCapability): string {
    return `Assistive AI run for capability ${capability}. Output must be non-authoritative.`;
  }

  private renderUserPrompt(
    template: string | undefined,
    input: Record<string, unknown> | undefined
  ): string {
    if (!template) {
      return JSON.stringify(input ?? {});
    }

    const inputJson = JSON.stringify(input ?? {});
    return template.replaceAll("{{inputJson}}", inputJson);
  }

  private extractSuggestions(
    aiRunId: string,
    dto: CreateAiRunDto,
    output: Record<string, unknown>,
    fallbackType: AiSuggestionType
  ): Prisma.AiSuggestionCreateManyInput[] {
    const suggestionsNode = output["suggestions"];
    if (!Array.isArray(suggestionsNode)) {
      return [];
    }

    return suggestionsNode
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const suggestionRecord = item as Record<string, unknown>;
        const requestedType = suggestionRecord["type"];
        const suggestionType =
          typeof requestedType === "string" &&
          VALID_SUGGESTION_TYPES.has(requestedType.toUpperCase())
            ? (requestedType.toUpperCase() as AiSuggestionType)
            : fallbackType;

        const rawConfidence = suggestionRecord["confidenceScore"];
        const confidenceScore =
          typeof rawConfidence === "number" ? rawConfidence : null;

        return {
          aiRunId,
          suggestionType,
          targetEntityType: dto.targetEntityType,
          targetEntityId: dto.targetEntityId,
          suggestionJson: suggestionRecord,
          confidenceScore
        } satisfies Prisma.AiSuggestionCreateManyInput;
      })
      .filter((item): item is Prisma.AiSuggestionCreateManyInput => Boolean(item));
  }
}

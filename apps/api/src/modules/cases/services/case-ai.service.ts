import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from "@nestjs/common";
import {
  AiCapability,
  AiRunStatus,
  AiSuggestionType,
  OperationalPriority,
  Prisma
} from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";
import { AuditService } from "../../audit/services/audit.service";
import { AiProviderService } from "../../ai/services/ai-provider.service";
import { AiPromptService } from "../../ai/services/ai-prompt.service";
import { AiRunsRepository } from "../../ai/repositories/ai-runs.repository";
import { AiSuggestionsRepository } from "../../ai/repositories/ai-suggestions.repository";
import { CasesRepository } from "../repositories/cases.repository";

type RecommendedCaseType =
  | "maintenance"
  | "billing"
  | "complaint"
  | "lease"
  | "general"
  | "other";

type RecommendedPriority = "low" | "medium" | "high" | "urgent";
type RecommendedWorkflow = "simple" | "escalation" | "vendor_dispatch";

@Injectable()
export class CaseAiService {
  private readonly logger = new Logger(CaseAiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly casesRepository: CasesRepository,
    private readonly aiRunsRepository: AiRunsRepository,
    private readonly aiSuggestionsRepository: AiSuggestionsRepository,
    private readonly aiPromptService: AiPromptService,
    private readonly aiProviderService: AiProviderService,
    private readonly auditService: AuditService
  ) {}

  async runCaseRecommendation(params: {
    organizationId: string;
    actorUserId: string;
    caseId: string;
    trigger: "case_create" | "case_update";
    requestId?: string;
  }) {
    const item = await this.requireScopedCase(params.caseId, params.organizationId);

    const inputJson = {
      case: {
        id: item.id,
        title: item.title,
        description: item.description,
        caseType: item.caseType,
        priority: item.priority,
        status: item.status,
        propertyId: item.propertyId,
        unitId: item.unitId,
        dueAt: item.dueAt?.toISOString() ?? null
      },
      property: item.property
        ? {
            id: item.property.id,
            propertyCode: item.property.propertyCode,
            name: item.property.name
          }
        : null,
      unit: item.unit
        ? {
            id: item.unit.id,
            unitNumber: item.unit.unitNumber,
            propertyId: item.unit.propertyId
          }
        : null,
      trigger: params.trigger
    };

    const capability = AiCapability.CASE_ASSIST;
    const promptTemplate = await this.aiPromptService.resolvePromptTemplate({
      capability,
      templateKey: "cases.recommendation"
    });

    const providerConfig = await this.aiProviderService.resolvePreferredConfig(
      params.organizationId,
      capability
    );
    const providerName = providerConfig?.providerName ?? "stub";
    const modelName = providerConfig?.modelName ?? "stub-v1";

    const run = await this.aiRunsRepository.create({
      organization: { connect: { id: params.organizationId } },
      capability,
      providerName,
      modelName,
      promptTemplate: promptTemplate ? { connect: { id: promptTemplate.id } } : undefined,
      targetEntityType: "Case",
      targetEntityId: item.id,
      status: AiRunStatus.PENDING,
      inputJson,
      createdByUser: { connect: { id: params.actorUserId } }
    });

    await this.aiRunsRepository.update(run.id, { status: AiRunStatus.RUNNING });

    try {
      const providerResponse = await this.aiProviderService.run({
        capability,
        providerName,
        modelName,
        systemPrompt:
          promptTemplate?.systemPrompt ??
          "Assistive case recommendation. Return JSON only. Non-authoritative.",
        userPrompt: this.renderUserPrompt(promptTemplate?.userPromptTemplate, inputJson),
        input: inputJson,
        settings: (providerConfig?.settingsJson as Record<string, unknown> | null) ?? null
      });

      const parsed = this.parseRecommendationOutput(providerResponse.output);

      await this.aiRunsRepository.update(run.id, {
        status: AiRunStatus.COMPLETED,
        outputJson: providerResponse.output,
        confidenceScore: providerResponse.confidenceScore ?? parsed.confidence,
        latencyMs: providerResponse.latencyMs,
        completedAt: new Date()
      });

      const suggestion = await this.aiSuggestionsRepository.create({
        aiRun: { connect: { id: run.id } },
        suggestionType: AiSuggestionType.ACTION_RECOMMENDATION,
        targetEntityType: "Case",
        targetEntityId: item.id,
        suggestionJson: {
          kind: "case_recommendation",
          schemaVersion: 1,
          ...parsed
        },
        confidenceScore: parsed.confidence
      });

      await this.auditService.record({
        organizationId: params.organizationId,
        actorUserId: params.actorUserId,
        actionType: "case.ai.recommendation_run",
        entityType: "Case",
        entityId: item.id,
        newValues: {
          aiRunId: run.id,
          suggestionId: suggestion.id,
          confidence: parsed.confidence
        },
        metadata: { requestId: params.requestId, trigger: params.trigger }
      });

      return { aiRunId: run.id, suggestionId: suggestion.id, ...parsed };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown AI provider error";
      this.logger.error(`Case recommendation AI run failed: ${message}`);
      await this.aiRunsRepository.update(run.id, {
        status: AiRunStatus.FAILED,
        errorCode: "AI_PROVIDER_ERROR",
        errorMessage: message,
        completedAt: new Date()
      });
      throw new InternalServerErrorException("Case recommendation failed");
    }
  }

  async listCaseSuggestions(params: {
    organizationId: string;
    caseId: string;
    limit?: number;
  }) {
    await this.requireScopedCase(params.caseId, params.organizationId);
    const suggestions = await this.aiSuggestionsRepository.listByTargetEntityScoped({
      organizationId: params.organizationId,
      targetEntityType: "Case",
      targetEntityId: params.caseId,
      suggestionTypes: AiSuggestionType.ACTION_RECOMMENDATION,
      limit: params.limit
    });
    return suggestions.filter((s) => this.readKind(s.suggestionJson) === "case_recommendation");
  }

  async applyCaseSuggestion(params: {
    organizationId: string;
    actorUserId: string;
    caseId: string;
    suggestionId: string;
    applyCaseType?: boolean;
    applyPriority?: boolean;
    requestId?: string;
    note?: string;
  }) {
    const item = await this.requireScopedCase(params.caseId, params.organizationId);

    const suggestion = await this.aiSuggestionsRepository.findByIdScoped(
      params.suggestionId,
      params.organizationId
    );
    if (!suggestion) {
      throw new NotFoundException("AI suggestion not found");
    }
    if (suggestion.targetEntityType !== "Case" || suggestion.targetEntityId !== params.caseId) {
      throw new NotFoundException("AI suggestion not found for this case");
    }
    if (suggestion.suggestionType !== AiSuggestionType.ACTION_RECOMMENDATION) {
      throw new NotFoundException("AI suggestion is not a case recommendation");
    }
    if (this.readKind(suggestion.suggestionJson) !== "case_recommendation") {
      throw new NotFoundException("AI suggestion is not a case recommendation");
    }

    const parsed = this.parseRecommendationSuggestionJson(suggestion.suggestionJson);

    if (suggestion.isApplied) {
      return { case: item, suggestionId: suggestion.id, appliedNow: false, appliedFields: [] as string[], recommendation: parsed };
    }

    const patch: Prisma.CaseUpdateInput = {};
    const appliedFields: string[] = [];

    if (params.applyCaseType) {
      patch.caseType = parsed.recommendedCaseType;
      appliedFields.push("caseType");
    }
    if (params.applyPriority) {
      patch.priority = this.mapPriority(parsed.recommendedPriority);
      appliedFields.push("priority");
    }

    const updated = appliedFields.length > 0 ? await this.casesRepository.update(item.id, patch) : item;

    await this.aiSuggestionsRepository.update(suggestion.id, {
      isApplied: true,
      appliedAt: new Date(),
      appliedByUser: { connect: { id: params.actorUserId } }
    });

    await this.auditService.record({
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      actionType: "case.ai.recommendation_applied",
      entityType: "Case",
      entityId: item.id,
      oldValues: { caseType: item.caseType, priority: item.priority },
      newValues: { caseType: updated.caseType, priority: updated.priority },
      metadata: {
        requestId: params.requestId,
        note: params.note,
        suggestionId: suggestion.id,
        aiRunId: suggestion.aiRunId,
        appliedFields
      }
    });

    return {
      case: updated,
      suggestionId: suggestion.id,
      appliedNow: true,
      appliedFields,
      recommendation: parsed
    };
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

  private parseRecommendationOutput(output: Record<string, unknown>) {
    const recommendedCaseType = this.normalizeCaseType(output["recommendedCaseType"]);
    const recommendedPriority = this.normalizePriority(output["recommendedPriority"]);
    const recommendedNextActionsRaw = output["recommendedNextActions"];
    const recommendedNextActions = Array.isArray(recommendedNextActionsRaw)
      ? recommendedNextActionsRaw.filter((x) => typeof x === "string").slice(0, 10)
      : [];
    const recommendedWorkflow = this.normalizeWorkflow(output["recommendedWorkflow"]);
    const reasoning = typeof output["reasoning"] === "string" ? output["reasoning"] : "";
    const confidence = this.normalizeConfidence(output["confidence"]);

    return {
      recommendedCaseType,
      recommendedPriority,
      recommendedNextActions,
      recommendedWorkflow,
      reasoning,
      confidence
    };
  }

  private parseRecommendationSuggestionJson(json: Prisma.JsonValue): {
    recommendedCaseType: RecommendedCaseType;
    recommendedPriority: RecommendedPriority;
  } & Record<string, unknown> {
    if (!json || typeof json !== "object" || Array.isArray(json)) {
      return { recommendedCaseType: "other", recommendedPriority: "medium" };
    }
    const node = json as Record<string, unknown>;
    return {
      ...node,
      recommendedCaseType: this.normalizeCaseType(node["recommendedCaseType"]),
      recommendedPriority: this.normalizePriority(node["recommendedPriority"])
    };
  }

  private readKind(json: Prisma.JsonValue): string | null {
    if (!json || typeof json !== "object" || Array.isArray(json)) {
      return null;
    }
    const node = json as Record<string, unknown>;
    return typeof node["kind"] === "string" ? node["kind"] : null;
  }

  private normalizeCaseType(value: unknown): RecommendedCaseType {
    const t = typeof value === "string" ? value.trim().toLowerCase() : "";
    if (t === "maintenance") return "maintenance";
    if (t === "billing") return "billing";
    if (t === "complaint") return "complaint";
    if (t === "lease") return "lease";
    if (t === "general") return "general";
    return "other";
  }

  private normalizePriority(value: unknown): RecommendedPriority {
    const p = typeof value === "string" ? value.trim().toLowerCase() : "";
    if (p === "low") return "low";
    if (p === "medium") return "medium";
    if (p === "high") return "high";
    if (p === "urgent") return "urgent";
    return "medium";
  }

  private normalizeWorkflow(value: unknown): RecommendedWorkflow {
    const w = typeof value === "string" ? value.trim().toLowerCase() : "";
    if (w === "simple") return "simple";
    if (w === "escalation") return "escalation";
    if (w === "vendor_dispatch") return "vendor_dispatch";
    return "simple";
  }

  private normalizeConfidence(value: unknown): number {
    const n = typeof value === "number" ? value : 0;
    return Math.max(0, Math.min(1, n));
  }

  private mapPriority(priority: RecommendedPriority): OperationalPriority {
    if (priority === "urgent") return OperationalPriority.URGENT;
    if (priority === "high") return OperationalPriority.HIGH;
    if (priority === "medium") return OperationalPriority.NORMAL;
    return OperationalPriority.LOW;
  }

  private async requireScopedCase(caseId: string, organizationId: string) {
    const item = await this.prisma.case.findFirst({
      where: { id: caseId, organizationId },
      include: {
        property: true,
        unit: true
      }
    });
    if (!item) {
      throw new NotFoundException("Case not found");
    }
    return item;
  }
}


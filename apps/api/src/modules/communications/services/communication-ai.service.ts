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
  CommunicationPriority,
  Prisma
} from "@prisma/client";
import { AuditService } from "../../audit/services/audit.service";
import { AiProviderService } from "../../ai/services/ai-provider.service";
import { AiPromptService } from "../../ai/services/ai-prompt.service";
import { AiRunsRepository } from "../../ai/repositories/ai-runs.repository";
import { AiSuggestionsRepository } from "../../ai/repositories/ai-suggestions.repository";
import { CommunicationsRepository } from "../repositories/communications.repository";
import { MessagesRepository } from "../repositories/messages.repository";

type TriageTopic = "maintenance" | "billing" | "general" | "complaint" | "lease" | "other";
type UrgencyLabel = "low" | "medium" | "high" | "urgent";

@Injectable()
export class CommunicationAiService {
  private readonly logger = new Logger(CommunicationAiService.name);

  constructor(
    private readonly communicationsRepository: CommunicationsRepository,
    private readonly messagesRepository: MessagesRepository,
    private readonly aiRunsRepository: AiRunsRepository,
    private readonly aiSuggestionsRepository: AiSuggestionsRepository,
    private readonly aiPromptService: AiPromptService,
    private readonly aiProviderService: AiProviderService,
    private readonly auditService: AuditService
  ) {}

  async runAssistiveTriageAndSummary(params: {
    organizationId: string;
    actorUserId: string;
    threadId: string;
    trigger: "thread_create" | "message_create";
    requestId?: string;
  }) {
    const thread = await this.requireScopedThread(params.threadId, params.organizationId);
    const messages = await this.messagesRepository.listByThread(params.threadId);
    const lastMessages = messages
      .slice(Math.max(0, messages.length - 20))
      .map((m) => ({
        id: m.id,
        direction: m.direction,
        bodyText: m.bodyText,
        createdAt: m.createdAt
      }));

    const baseInput = {
      threadId: thread.id,
      channelType: thread.channelType,
      subject: thread.subject,
      linkedEntityType: thread.linkedEntityType,
      linkedEntityId: thread.linkedEntityId,
      currentPriority: thread.priority,
      messageCount: messages.length,
      lastMessages,
      trigger: params.trigger
    };

    const triage = await this.runTriage({
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      threadId: thread.id,
      inputJson: { ...baseInput, task: "triage" },
      requestId: params.requestId
    });

    const summary = await this.runSummary({
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      threadId: thread.id,
      inputJson: { ...baseInput, task: "summary" },
      requestId: params.requestId
    });

    return { triage, summary };
  }

  async listThreadSuggestions(params: {
    organizationId: string;
    threadId: string;
    limit?: number;
  }) {
    await this.requireScopedThread(params.threadId, params.organizationId);

    const [triage, summary] = await Promise.all([
      this.aiSuggestionsRepository.listByTargetEntityScoped({
        organizationId: params.organizationId,
        targetEntityType: "CommunicationThread",
        targetEntityId: params.threadId,
        suggestionTypes: AiSuggestionType.ACTION_RECOMMENDATION,
        limit: params.limit
      }),
      this.aiSuggestionsRepository.listByTargetEntityScoped({
        organizationId: params.organizationId,
        targetEntityType: "CommunicationThread",
        targetEntityId: params.threadId,
        suggestionTypes: AiSuggestionType.GENERIC,
        limit: params.limit
      })
    ]);

    // Filter to only the suggestions produced by this feature, in case GENERIC is used elsewhere.
    return {
      triage: triage.filter((s) => this.readKind(s.suggestionJson) === "communication_triage"),
      summary: summary.filter((s) => this.readKind(s.suggestionJson) === "communication_summary")
    };
  }

  async applyTriageSuggestion(params: {
    organizationId: string;
    actorUserId: string;
    threadId: string;
    suggestionId: string;
    requestId?: string;
    note?: string;
  }) {
    const thread = await this.requireScopedThread(params.threadId, params.organizationId);

    const suggestion = await this.aiSuggestionsRepository.findByIdScoped(
      params.suggestionId,
      params.organizationId
    );
    if (!suggestion) {
      throw new NotFoundException("AI suggestion not found");
    }

    if (
      suggestion.targetEntityType !== "CommunicationThread" ||
      suggestion.targetEntityId !== params.threadId
    ) {
      throw new NotFoundException("AI suggestion not found for this thread");
    }
    if (suggestion.suggestionType !== AiSuggestionType.ACTION_RECOMMENDATION) {
      throw new NotFoundException("AI suggestion is not a triage suggestion");
    }
    if (this.readKind(suggestion.suggestionJson) !== "communication_triage") {
      throw new NotFoundException("AI suggestion is not a triage suggestion");
    }

    // Idempotent apply: already applied suggestions do nothing and do not re-audit.
    if (suggestion.isApplied) {
      return { thread, suggestionId: suggestion.id, appliedNow: false, priorityChanged: false };
    }

    const triage = this.parseTriageSuggestionJson(suggestion.suggestionJson);
    const suggestedPriority = this.mapUrgencyToPriority(triage.urgency);

    // Conservative: do not override a manually set priority unless it's still NORMAL.
    const canChangePriority = thread.priority === CommunicationPriority.NORMAL;
    const updated = canChangePriority
      ? await this.communicationsRepository.update(thread.id, { priority: suggestedPriority })
      : thread;

    await this.aiSuggestionsRepository.update(suggestion.id, {
      isApplied: true,
      appliedAt: new Date(),
      appliedByUser: { connect: { id: params.actorUserId } }
    });

    await this.auditService.record({
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      actionType: "communication.ai.triage_applied",
      entityType: "CommunicationThread",
      entityId: thread.id,
      oldValues: { priority: thread.priority },
      newValues: { priority: updated.priority },
      metadata: {
        requestId: params.requestId,
        note: params.note,
        suggestionId: suggestion.id,
        aiRunId: suggestion.aiRunId,
        priorityChanged: canChangePriority
      }
    });

    return {
      thread: updated,
      suggestionId: suggestion.id,
      appliedNow: true,
      priorityChanged: canChangePriority
    };
  }

  async applySummarySuggestion(params: {
    organizationId: string;
    actorUserId: string;
    threadId: string;
    suggestionId: string;
    requestId?: string;
    note?: string;
  }) {
    await this.requireScopedThread(params.threadId, params.organizationId);

    const suggestion = await this.aiSuggestionsRepository.findByIdScoped(
      params.suggestionId,
      params.organizationId
    );
    if (!suggestion) {
      throw new NotFoundException("AI suggestion not found");
    }

    if (
      suggestion.targetEntityType !== "CommunicationThread" ||
      suggestion.targetEntityId !== params.threadId
    ) {
      throw new NotFoundException("AI suggestion not found for this thread");
    }
    if (suggestion.suggestionType !== AiSuggestionType.GENERIC) {
      throw new NotFoundException("AI suggestion is not a summary suggestion");
    }
    if (this.readKind(suggestion.suggestionJson) !== "communication_summary") {
      throw new NotFoundException("AI suggestion is not a summary suggestion");
    }

    if (suggestion.isApplied) {
      return { suggestionId: suggestion.id, appliedNow: false };
    }

    await this.aiSuggestionsRepository.update(suggestion.id, {
      isApplied: true,
      appliedAt: new Date(),
      appliedByUser: { connect: { id: params.actorUserId } }
    });

    await this.auditService.record({
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      actionType: "communication.ai.summary_applied",
      entityType: "CommunicationThread",
      entityId: params.threadId,
      newValues: {
        suggestionId: suggestion.id,
        aiRunId: suggestion.aiRunId
      },
      metadata: {
        requestId: params.requestId,
        note: params.note
      }
    });

    return { suggestionId: suggestion.id, appliedNow: true };
  }

  private async runTriage(params: {
    organizationId: string;
    actorUserId: string;
    threadId: string;
    inputJson: Record<string, unknown>;
    requestId?: string;
  }) {
    const capability = AiCapability.COMMUNICATION_ASSIST;
    const promptTemplate = await this.aiPromptService.resolvePromptTemplate({
      capability,
      templateKey: "communications.triage"
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
      targetEntityType: "CommunicationThread",
      targetEntityId: params.threadId,
      status: AiRunStatus.PENDING,
      inputJson: params.inputJson,
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
          "Assistive triage only. Return JSON only. Non-authoritative.",
        userPrompt: this.renderUserPrompt(promptTemplate?.userPromptTemplate, params.inputJson),
        input: params.inputJson,
        settings: (providerConfig?.settingsJson as Record<string, unknown> | null) ?? null
      });

      const parsed = this.parseTriageOutput(providerResponse.output);

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
        targetEntityType: "CommunicationThread",
        targetEntityId: params.threadId,
        suggestionJson: {
          kind: "communication_triage",
          schemaVersion: 1,
          ...parsed
        },
        confidenceScore: parsed.confidence
      });

      await this.auditService.record({
        organizationId: params.organizationId,
        actorUserId: params.actorUserId,
        actionType: "communication.ai.triage_run",
        entityType: "CommunicationThread",
        entityId: params.threadId,
        newValues: {
          aiRunId: run.id,
          suggestionId: suggestion.id,
          topic: parsed.topic,
          urgency: parsed.urgency,
          confidence: parsed.confidence
        },
        metadata: { requestId: params.requestId }
      });

      return { aiRunId: run.id, suggestionId: suggestion.id, ...parsed };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown AI provider error";
      this.logger.error(`Communication triage AI run failed: ${message}`);
      await this.aiRunsRepository.update(run.id, {
        status: AiRunStatus.FAILED,
        errorCode: "AI_PROVIDER_ERROR",
        errorMessage: message,
        completedAt: new Date()
      });
      throw new InternalServerErrorException("Communication triage failed");
    }
  }

  private async runSummary(params: {
    organizationId: string;
    actorUserId: string;
    threadId: string;
    inputJson: Record<string, unknown>;
    requestId?: string;
  }) {
    const capability = AiCapability.COMMUNICATION_ASSIST;
    const promptTemplate = await this.aiPromptService.resolvePromptTemplate({
      capability,
      templateKey: "communications.summary"
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
      targetEntityType: "CommunicationThread",
      targetEntityId: params.threadId,
      status: AiRunStatus.PENDING,
      inputJson: params.inputJson,
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
          "Assistive summary only. Return JSON only. Non-authoritative.",
        userPrompt: this.renderUserPrompt(promptTemplate?.userPromptTemplate, params.inputJson),
        input: params.inputJson,
        settings: (providerConfig?.settingsJson as Record<string, unknown> | null) ?? null
      });

      const parsed = this.parseSummaryOutput(providerResponse.output);

      await this.aiRunsRepository.update(run.id, {
        status: AiRunStatus.COMPLETED,
        outputJson: providerResponse.output,
        confidenceScore: providerResponse.confidenceScore ?? parsed.confidence,
        latencyMs: providerResponse.latencyMs,
        completedAt: new Date()
      });

      const suggestion = await this.aiSuggestionsRepository.create({
        aiRun: { connect: { id: run.id } },
        suggestionType: AiSuggestionType.GENERIC,
        targetEntityType: "CommunicationThread",
        targetEntityId: params.threadId,
        suggestionJson: {
          kind: "communication_summary",
          schemaVersion: 1,
          ...parsed
        },
        confidenceScore: parsed.confidence
      });

      await this.auditService.record({
        organizationId: params.organizationId,
        actorUserId: params.actorUserId,
        actionType: "communication.ai.summary_run",
        entityType: "CommunicationThread",
        entityId: params.threadId,
        newValues: {
          aiRunId: run.id,
          suggestionId: suggestion.id,
          confidence: parsed.confidence
        },
        metadata: { requestId: params.requestId }
      });

      return { aiRunId: run.id, suggestionId: suggestion.id, ...parsed };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown AI provider error";
      this.logger.error(`Communication summary AI run failed: ${message}`);
      await this.aiRunsRepository.update(run.id, {
        status: AiRunStatus.FAILED,
        errorCode: "AI_PROVIDER_ERROR",
        errorMessage: message,
        completedAt: new Date()
      });
      throw new InternalServerErrorException("Communication summary failed");
    }
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

  private parseTriageOutput(output: Record<string, unknown>) {
    const topic = this.normalizeTopic(output["topic"]);
    const urgency = this.normalizeUrgency(output["urgency"]);
    const recommendedCaseType =
      typeof output["recommendedCaseType"] === "string" ? output["recommendedCaseType"] : null;
    const recommendedPriority =
      typeof output["recommendedPriority"] === "string" ? output["recommendedPriority"] : null;
    const reasoning = typeof output["reasoning"] === "string" ? output["reasoning"] : "";
    const confidence = this.normalizeConfidence(output["confidence"]);

    return {
      topic,
      urgency,
      recommendedCaseType,
      recommendedPriority,
      reasoning,
      confidence
    };
  }

  private parseSummaryOutput(output: Record<string, unknown>) {
    const summary = typeof output["summary"] === "string" ? output["summary"] : "";
    const keyPointsRaw = output["keyPoints"];
    const keyPoints = Array.isArray(keyPointsRaw)
      ? keyPointsRaw.filter((x) => typeof x === "string").slice(0, 10)
      : [];
    const confidence = this.normalizeConfidence(output["confidence"]);
    return { summary, keyPoints, confidence };
  }

  private parseTriageSuggestionJson(json: Prisma.JsonValue): { urgency: UrgencyLabel } {
    if (!json || typeof json !== "object" || Array.isArray(json)) {
      return { urgency: "medium" };
    }
    const node = json as Record<string, unknown>;
    return { urgency: this.normalizeUrgency(node["urgency"]) };
  }

  private readKind(json: Prisma.JsonValue): string | null {
    if (!json || typeof json !== "object" || Array.isArray(json)) {
      return null;
    }
    const node = json as Record<string, unknown>;
    return typeof node["kind"] === "string" ? node["kind"] : null;
  }

  private normalizeTopic(value: unknown): TriageTopic {
    const t = typeof value === "string" ? value.trim().toLowerCase() : "";
    if (t === "maintenance") return "maintenance";
    if (t === "billing") return "billing";
    if (t === "general") return "general";
    if (t === "complaint") return "complaint";
    if (t === "lease") return "lease";
    return "other";
  }

  private normalizeUrgency(value: unknown): UrgencyLabel {
    const u = typeof value === "string" ? value.trim().toLowerCase() : "";
    if (u === "low") return "low";
    if (u === "medium") return "medium";
    if (u === "high") return "high";
    if (u === "urgent") return "urgent";
    return "medium";
  }

  private normalizeConfidence(value: unknown): number {
    const n = typeof value === "number" ? value : 0;
    return Math.max(0, Math.min(1, n));
  }

  private mapUrgencyToPriority(urgency: UrgencyLabel): CommunicationPriority {
    if (urgency === "urgent") return CommunicationPriority.URGENT;
    if (urgency === "high") return CommunicationPriority.HIGH;
    if (urgency === "medium") return CommunicationPriority.NORMAL;
    return CommunicationPriority.LOW;
  }

  private async requireScopedThread(threadId: string, organizationId: string) {
    const thread = await this.communicationsRepository.findByIdScoped(threadId, organizationId);
    if (!thread) {
      throw new NotFoundException("Communication thread not found");
    }
    return thread;
  }
}


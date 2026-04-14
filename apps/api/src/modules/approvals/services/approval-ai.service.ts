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
  ApprovalTargetEntityType,
  Prisma
} from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";
import { AuditService } from "../../audit/services/audit.service";
import { AiProviderService } from "../../ai/services/ai-provider.service";
import { AiPromptService } from "../../ai/services/ai-prompt.service";
import { AiRunsRepository } from "../../ai/repositories/ai-runs.repository";
import { AiSuggestionsRepository } from "../../ai/repositories/ai-suggestions.repository";
import { AiCapabilityDisabledError } from "../../ai/services/ai-provider.service";

type FlowType = "single_step" | "multi_step";

@Injectable()
export class ApprovalAiService {
  private readonly logger = new Logger(ApprovalAiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiRunsRepository: AiRunsRepository,
    private readonly aiSuggestionsRepository: AiSuggestionsRepository,
    private readonly aiPromptService: AiPromptService,
    private readonly aiProviderService: AiProviderService,
    private readonly auditService: AuditService
  ) {}

  async runInvoiceRoutingRecommendation(params: {
    organizationId: string;
    actorUserId: string;
    invoiceId: string;
    trigger: "submit_for_review" | "submit_for_approval";
    requestId?: string;
  }) {
    const invoice = await this.requireScopedInvoice(params.invoiceId, params.organizationId);

    const existingFlow = await this.prisma.approvalFlow.findFirst({
      where: {
        organizationId: params.organizationId,
        targetEntityType: ApprovalTargetEntityType.INVOICE,
        targetEntityId: params.invoiceId
      },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
      orderBy: { createdAt: "desc" }
    });

    const totalAmount = invoice.totalAmount ? invoice.totalAmount.toString() : null;
    const subtotalAmount = invoice.subtotalAmount ? invoice.subtotalAmount.toString() : null;
    const taxAmount = invoice.taxAmount ? invoice.taxAmount.toString() : null;

    const inputJson = {
      invoice: {
        id: invoice.id,
        approvalStatus: invoice.approvalStatus,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate?.toISOString() ?? null,
        dueDate: invoice.dueDate?.toISOString() ?? null,
        currencyCode: invoice.currencyCode,
        subtotalAmount,
        taxAmount,
        totalAmount,
        propertyId: invoice.propertyId,
        vendorId: invoice.vendorId,
        extractionConfidence: invoice.extractionConfidence,
        duplicateCheckStatus: invoice.duplicateCheckStatus
      },
      vendor: invoice.vendor
        ? {
            id: invoice.vendor.id,
            name: invoice.vendor.name,
            tradeCategory: invoice.vendor.tradeCategory
          }
        : null,
      property: invoice.property
        ? {
            id: invoice.property.id,
            propertyCode: invoice.property.propertyCode,
            name: invoice.property.name
          }
        : null,
      lines: invoice.lines.slice(0, 50).map((l) => ({
        lineNumber: l.lineNumber,
        description: l.description,
        quantity: l.quantity ? l.quantity.toString() : null,
        unitPrice: l.unitPrice ? l.unitPrice.toString() : null,
        lineTotal: l.lineTotal ? l.lineTotal.toString() : null
      })),
      approvalContext: existingFlow
        ? {
            flowId: existingFlow.id,
            flowType: existingFlow.flowType,
            status: existingFlow.status,
            steps: existingFlow.steps.map((s) => ({
              stepOrder: s.stepOrder,
              approverUserId: s.approverUserId,
              approverRole: s.approverRole,
              status: s.status,
              decision: s.decision
            }))
          }
        : null,
      trigger: params.trigger
    };

    const capability = AiCapability.APPROVAL_ASSIST;
    const promptTemplate = await this.aiPromptService.resolvePromptTemplate({
      capability,
      templateKey: "invoices.approval_routing"
    });

    const providerConfig = await this.aiProviderService.resolveEffectiveConfig(
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
      targetEntityType: "Invoice",
      targetEntityId: invoice.id,
      status: AiRunStatus.PENDING,
      inputJson,
      createdByUser: { connect: { id: params.actorUserId } }
    });

      await this.aiRunsRepository.update(run.id, { status: AiRunStatus.RUNNING });

    try {
      const providerResponse = await this.aiProviderService.run({
        organizationId: params.organizationId,
        capability,
        providerName,
        modelName,
        systemPrompt:
          promptTemplate?.systemPrompt ??
          "Assistive approval routing recommendation. Return JSON only. Non-authoritative.",
        userPrompt: this.renderUserPrompt(promptTemplate?.userPromptTemplate, inputJson),
        input: inputJson,
        settings: (providerConfig?.settingsJson as Record<string, unknown> | null) ?? null
      });

      const parsed = this.parseRoutingOutput(providerResponse.output);

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
        targetEntityType: "Invoice",
        targetEntityId: invoice.id,
        suggestionJson: {
          kind: "invoice_approval_routing",
          schemaVersion: 1,
          ...parsed
        },
        confidenceScore: parsed.confidence
      });

      await this.auditService.record({
        organizationId: params.organizationId,
        actorUserId: params.actorUserId,
        actionType: "invoice.ai.routing_run",
        entityType: "Invoice",
        entityId: invoice.id,
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
      this.logger.error(`Approval routing AI run failed: ${message}`);
      const isDisabled = error instanceof AiCapabilityDisabledError;
      await this.aiRunsRepository.update(run.id, {
        status: AiRunStatus.FAILED,
        errorCode: isDisabled ? "AI_DISABLED" : "AI_PROVIDER_ERROR",
        errorMessage: message,
        completedAt: new Date()
      });
      throw new InternalServerErrorException("Approval routing recommendation failed");
    }
  }

  async listInvoiceRoutingSuggestions(params: {
    organizationId: string;
    invoiceId: string;
    limit?: number;
  }) {
    await this.requireScopedInvoice(params.invoiceId, params.organizationId);
    const suggestions = await this.aiSuggestionsRepository.listByTargetEntityScoped({
      organizationId: params.organizationId,
      targetEntityType: "Invoice",
      targetEntityId: params.invoiceId,
      suggestionTypes: AiSuggestionType.ACTION_RECOMMENDATION,
      limit: params.limit
    });
    return suggestions.filter((s) => this.readKind(s.suggestionJson) === "invoice_approval_routing");
  }

  async applyInvoiceRoutingSuggestion(params: {
    organizationId: string;
    actorUserId: string;
    invoiceId: string;
    suggestionId: string;
    requestId?: string;
    note?: string;
  }) {
    await this.requireScopedInvoice(params.invoiceId, params.organizationId);

    const suggestion = await this.aiSuggestionsRepository.findByIdScoped(
      params.suggestionId,
      params.organizationId
    );
    if (!suggestion) {
      throw new NotFoundException("AI suggestion not found");
    }
    if (
      suggestion.targetEntityType !== "Invoice" ||
      suggestion.targetEntityId !== params.invoiceId
    ) {
      throw new NotFoundException("AI suggestion not found for this invoice");
    }
    if (suggestion.suggestionType !== AiSuggestionType.ACTION_RECOMMENDATION) {
      throw new NotFoundException("AI suggestion is not a routing suggestion");
    }
    if (this.readKind(suggestion.suggestionJson) !== "invoice_approval_routing") {
      throw new NotFoundException("AI suggestion is not a routing suggestion");
    }

    if (suggestion.isApplied) {
      return {
        suggestionId: suggestion.id,
        appliedNow: false,
        routing: this.parseRoutingSuggestionJson(suggestion.suggestionJson)
      };
    }

    await this.aiSuggestionsRepository.update(suggestion.id, {
      isApplied: true,
      appliedAt: new Date(),
      appliedByUser: { connect: { id: params.actorUserId } }
    });

    const routing = this.parseRoutingSuggestionJson(suggestion.suggestionJson);

    await this.auditService.record({
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      actionType: "invoice.ai.routing_applied",
      entityType: "Invoice",
      entityId: params.invoiceId,
      newValues: {
        suggestionId: suggestion.id,
        aiRunId: suggestion.aiRunId,
        routing
      },
      metadata: { requestId: params.requestId, note: params.note }
    });

    return { suggestionId: suggestion.id, appliedNow: true, routing };
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

  private parseRoutingOutput(output: Record<string, unknown>): {
    recommendedApproverRoles: string[];
    recommendedApproverUserIds: string[];
    recommendedFlowType: FlowType;
    reasoning: string;
    confidence: number;
  } {
    const rolesRaw = output["recommendedApproverRoles"];
    const usersRaw = output["recommendedApproverUserIds"];
    const flowRaw = output["recommendedFlowType"];

    const recommendedApproverRoles = Array.isArray(rolesRaw)
      ? rolesRaw.filter((x) => typeof x === "string").slice(0, 10)
      : [];
    const recommendedApproverUserIds = Array.isArray(usersRaw)
      ? usersRaw.filter((x) => typeof x === "string").slice(0, 20)
      : [];

    const flowType =
      typeof flowRaw === "string" && flowRaw.toLowerCase() === "multi_step"
        ? "multi_step"
        : "single_step";

    const reasoning = typeof output["reasoning"] === "string" ? output["reasoning"] : "";
    const confidence = this.normalizeConfidence(output["confidence"]);

    return {
      recommendedApproverRoles,
      recommendedApproverUserIds,
      recommendedFlowType: flowType,
      reasoning,
      confidence
    };
  }

  private parseRoutingSuggestionJson(json: Prisma.JsonValue): {
    recommendedApproverRoles: string[];
    recommendedApproverUserIds: string[];
    recommendedFlowType: FlowType;
    reasoning?: string;
    confidence?: number;
  } {
    if (!json || typeof json !== "object" || Array.isArray(json)) {
      return {
        recommendedApproverRoles: [],
        recommendedApproverUserIds: [],
        recommendedFlowType: "single_step"
      };
    }
    const node = json as Record<string, unknown>;
    const rolesRaw = node["recommendedApproverRoles"];
    const usersRaw = node["recommendedApproverUserIds"];
    const flowRaw = node["recommendedFlowType"];

    return {
      recommendedApproverRoles: Array.isArray(rolesRaw)
        ? rolesRaw.filter((x) => typeof x === "string").slice(0, 10)
        : [],
      recommendedApproverUserIds: Array.isArray(usersRaw)
        ? usersRaw.filter((x) => typeof x === "string").slice(0, 20)
        : [],
      recommendedFlowType:
        typeof flowRaw === "string" && flowRaw.toLowerCase() === "multi_step"
          ? "multi_step"
          : "single_step",
      reasoning: typeof node["reasoning"] === "string" ? (node["reasoning"] as string) : undefined,
      confidence: typeof node["confidence"] === "number" ? (node["confidence"] as number) : undefined
    };
  }

  private readKind(json: Prisma.JsonValue): string | null {
    if (!json || typeof json !== "object" || Array.isArray(json)) {
      return null;
    }
    const node = json as Record<string, unknown>;
    return typeof node["kind"] === "string" ? node["kind"] : null;
  }

  private normalizeConfidence(value: unknown): number {
    const n = typeof value === "number" ? value : 0;
    return Math.max(0, Math.min(1, n));
  }

  private async requireScopedInvoice(invoiceId: string, organizationId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId },
      include: {
        vendor: true,
        property: true,
        lines: true
      }
    });
    if (!invoice) {
      throw new NotFoundException("Invoice not found");
    }
    return invoice;
  }
}

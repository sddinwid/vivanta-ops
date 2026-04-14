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
  Prisma
} from "@prisma/client";
import { AuditService } from "../../audit/services/audit.service";
import { AiProviderService } from "../../ai/services/ai-provider.service";
import { AiPromptService } from "../../ai/services/ai-prompt.service";
import { AiRunsRepository } from "../../ai/repositories/ai-runs.repository";
import { AiSuggestionsRepository } from "../../ai/repositories/ai-suggestions.repository";
import { DocumentsRepository } from "../repositories/documents.repository";

type DocumentType = "invoice" | "lease" | "contract" | "unknown";

const DEFAULT_EXTRACTION_MIN_CONFIDENCE = 0.8;

@Injectable()
export class DocumentAiService {
  private readonly logger = new Logger(DocumentAiService.name);

  constructor(
    private readonly documentsRepository: DocumentsRepository,
    private readonly aiRunsRepository: AiRunsRepository,
    private readonly aiSuggestionsRepository: AiSuggestionsRepository,
    private readonly aiPromptService: AiPromptService,
    private readonly aiProviderService: AiProviderService,
    private readonly auditService: AuditService
  ) {}

  async runAssistiveClassificationAndMaybeExtraction(params: {
    organizationId: string;
    actorUserId: string;
    documentId: string;
    trigger: "upload" | "reprocess";
    requestId?: string;
  }) {
    const doc = await this.requireScopedDocument(params.documentId, params.organizationId);

    const classification = await this.runClassification({
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      documentId: doc.id,
      inputJson: {
        documentId: doc.id,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        fileSizeBytes: doc.fileSizeBytes,
        checksumSha256: doc.checksumSha256,
        storageKey: doc.storageKey
      },
      requestId: params.requestId
    });

    const isManuallyInvoice =
      typeof doc.documentType === "string" &&
      doc.documentType.trim().toLowerCase() === "invoice";

    const shouldExtractBecauseInvoice =
      isManuallyInvoice || classification.documentType === "invoice";

    if (!shouldExtractBecauseInvoice) {
      return { classification, extraction: null };
    }

    const meetsConfidenceThreshold =
      classification.confidence >= DEFAULT_EXTRACTION_MIN_CONFIDENCE;
    const isManualTrigger = params.trigger === "reprocess";

    if (!isManuallyInvoice && !meetsConfidenceThreshold && !isManualTrigger) {
      return { classification, extraction: null };
    }

    const extraction = await this.runInvoiceExtraction({
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      documentId: doc.id,
      inputJson: {
        documentId: doc.id,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        fileSizeBytes: doc.fileSizeBytes,
        checksumSha256: doc.checksumSha256,
        storageKey: doc.storageKey
      },
      requestId: params.requestId
    });

    return { classification, extraction };
  }

  async listDocumentSuggestions(params: {
    organizationId: string;
    documentId: string;
    limit?: number;
  }) {
    await this.requireScopedDocument(params.documentId, params.organizationId);

    const [classification, extraction] = await Promise.all([
      this.aiSuggestionsRepository.listByTargetEntityScoped({
        organizationId: params.organizationId,
        targetEntityType: "Document",
        targetEntityId: params.documentId,
        suggestionTypes: AiSuggestionType.CLASSIFICATION,
        limit: params.limit
      }),
      this.aiSuggestionsRepository.listByTargetEntityScoped({
        organizationId: params.organizationId,
        targetEntityType: "Document",
        targetEntityId: params.documentId,
        suggestionTypes: AiSuggestionType.FIELD_EXTRACTION,
        limit: params.limit
      })
    ]);

    return {
      classification,
      extraction
    };
  }

  async applyClassificationSuggestion(params: {
    organizationId: string;
    actorUserId: string;
    documentId: string;
    suggestionId: string;
    requestId?: string;
    note?: string;
  }) {
    const doc = await this.requireScopedDocument(params.documentId, params.organizationId);

    const suggestion = await this.aiSuggestionsRepository.findByIdScoped(
      params.suggestionId,
      params.organizationId
    );
    if (!suggestion) {
      throw new NotFoundException("AI suggestion not found");
    }

    if (
      suggestion.targetEntityType !== "Document" ||
      suggestion.targetEntityId !== params.documentId
    ) {
      throw new NotFoundException("AI suggestion not found for this document");
    }

    if (suggestion.suggestionType !== AiSuggestionType.CLASSIFICATION) {
      throw new NotFoundException("AI suggestion is not a classification suggestion");
    }

    const parsed = this.parseClassificationSuggestionJson(suggestion.suggestionJson);
    const nextDocumentType = parsed.documentType;

    // Idempotent apply: applied suggestions can be retried safely.
    if (suggestion.isApplied) {
      return { document: doc, suggestionId: suggestion.id, appliedNow: false };
    }

    await this.aiSuggestionsRepository.update(suggestion.id, {
      isApplied: true,
      appliedAt: new Date(),
      appliedByUser: { connect: { id: params.actorUserId } }
    });

    const currentType = (doc.documentType ?? "").trim();
    const updated =
      currentType.toLowerCase() === nextDocumentType
        ? doc
        : await this.documentsRepository.update(doc.id, {
            documentType: nextDocumentType
          });

    await this.auditService.record({
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      actionType: "document.ai.classification_applied",
      entityType: "Document",
      entityId: doc.id,
      oldValues: { documentType: doc.documentType },
      newValues: { documentType: updated.documentType },
      metadata: {
        requestId: params.requestId,
        note: params.note,
        suggestionId: suggestion.id,
        aiRunId: suggestion.aiRunId
      }
    });

    return { document: updated, suggestionId: suggestion.id, appliedNow: true };
  }

  async applyExtractionSuggestion(params: {
    organizationId: string;
    actorUserId: string;
    documentId: string;
    suggestionId: string;
    requestId?: string;
    note?: string;
  }) {
    await this.requireScopedDocument(params.documentId, params.organizationId);

    const suggestion = await this.aiSuggestionsRepository.findByIdScoped(
      params.suggestionId,
      params.organizationId
    );
    if (!suggestion) {
      throw new NotFoundException("AI suggestion not found");
    }

    if (
      suggestion.targetEntityType !== "Document" ||
      suggestion.targetEntityId !== params.documentId
    ) {
      throw new NotFoundException("AI suggestion not found for this document");
    }

    if (suggestion.suggestionType !== AiSuggestionType.FIELD_EXTRACTION) {
      throw new NotFoundException("AI suggestion is not an extraction suggestion");
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
      actionType: "document.ai.extraction_applied",
      entityType: "Document",
      entityId: params.documentId,
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

  private async runClassification(params: {
    organizationId: string;
    actorUserId: string;
    documentId: string;
    inputJson: Record<string, unknown>;
    requestId?: string;
  }): Promise<{ aiRunId: string; suggestionId: string; documentType: DocumentType; confidence: number }> {
    const capability = AiCapability.DOCUMENT_ANALYSIS;
    const promptTemplate = await this.aiPromptService.resolvePromptTemplate({
      capability
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
      targetEntityType: "Document",
      targetEntityId: params.documentId,
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
          "Classify the document type. Output must be non-authoritative.",
        userPrompt: this.renderUserPrompt(promptTemplate?.userPromptTemplate, params.inputJson),
        input: params.inputJson,
        settings: (providerConfig?.settingsJson as Record<string, unknown> | null) ?? null
      });

      const parsed = this.parseClassificationOutput(providerResponse.output);

      await this.aiRunsRepository.update(run.id, {
        status: AiRunStatus.COMPLETED,
        outputJson: providerResponse.output,
        confidenceScore: providerResponse.confidenceScore ?? parsed.confidence,
        latencyMs: providerResponse.latencyMs,
        completedAt: new Date()
      });

      const suggestion = await this.aiSuggestionsRepository.create({
        aiRun: { connect: { id: run.id } },
        suggestionType: AiSuggestionType.CLASSIFICATION,
        targetEntityType: "Document",
        targetEntityId: params.documentId,
        suggestionJson: {
          documentType: parsed.documentType,
          confidence: parsed.confidence,
          reasoning: parsed.reasoning
        },
        confidenceScore: parsed.confidence
      });

      await this.auditService.record({
        organizationId: params.organizationId,
        actorUserId: params.actorUserId,
        actionType: "document.ai.classification_run",
        entityType: "Document",
        entityId: params.documentId,
        newValues: {
          aiRunId: run.id,
          suggestionId: suggestion.id,
          documentType: parsed.documentType,
          confidence: parsed.confidence
        },
        metadata: { requestId: params.requestId }
      });

      return {
        aiRunId: run.id,
        suggestionId: suggestion.id,
        documentType: parsed.documentType,
        confidence: parsed.confidence
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown AI provider error";
      this.logger.error(`Document classification AI run failed: ${message}`);
      await this.aiRunsRepository.update(run.id, {
        status: AiRunStatus.FAILED,
        errorCode: "AI_PROVIDER_ERROR",
        errorMessage: message,
        completedAt: new Date()
      });
      throw new InternalServerErrorException("Document classification failed");
    }
  }

  private async runInvoiceExtraction(params: {
    organizationId: string;
    actorUserId: string;
    documentId: string;
    inputJson: Record<string, unknown>;
    requestId?: string;
  }): Promise<{ aiRunId: string; suggestionId: string; confidence: number }> {
    const capability = AiCapability.INVOICE_ANALYSIS;
    const promptTemplate = await this.aiPromptService.resolvePromptTemplate({
      capability
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
      targetEntityType: "Document",
      targetEntityId: params.documentId,
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
          "Extract invoice-like fields. Output must be non-authoritative.",
        userPrompt: this.renderUserPrompt(promptTemplate?.userPromptTemplate, params.inputJson),
        input: params.inputJson,
        settings: (providerConfig?.settingsJson as Record<string, unknown> | null) ?? null
      });

      const parsed = this.parseInvoiceExtractionOutput(providerResponse.output);

      await this.aiRunsRepository.update(run.id, {
        status: AiRunStatus.COMPLETED,
        outputJson: providerResponse.output,
        confidenceScore: providerResponse.confidenceScore ?? parsed.confidence,
        latencyMs: providerResponse.latencyMs,
        completedAt: new Date()
      });

      const suggestion = await this.aiSuggestionsRepository.create({
        aiRun: { connect: { id: run.id } },
        suggestionType: AiSuggestionType.FIELD_EXTRACTION,
        targetEntityType: "Document",
        targetEntityId: params.documentId,
        suggestionJson: parsed,
        confidenceScore: parsed.confidence
      });

      await this.auditService.record({
        organizationId: params.organizationId,
        actorUserId: params.actorUserId,
        actionType: "document.ai.extraction_run",
        entityType: "Document",
        entityId: params.documentId,
        newValues: {
          aiRunId: run.id,
          suggestionId: suggestion.id,
          confidence: parsed.confidence
        },
        metadata: { requestId: params.requestId }
      });

      return { aiRunId: run.id, suggestionId: suggestion.id, confidence: parsed.confidence };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown AI provider error";
      this.logger.error(`Document extraction AI run failed: ${message}`);
      await this.aiRunsRepository.update(run.id, {
        status: AiRunStatus.FAILED,
        errorCode: "AI_PROVIDER_ERROR",
        errorMessage: message,
        completedAt: new Date()
      });
      throw new InternalServerErrorException("Document extraction failed");
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

  private parseClassificationOutput(output: Record<string, unknown>): {
    documentType: DocumentType;
    confidence: number;
    reasoning: string | null;
  } {
    const rawType = typeof output["documentType"] === "string" ? output["documentType"] : "";
    const normalized = this.normalizeDocumentType(rawType);

    const rawConfidence = output["confidence"];
    const confidence = typeof rawConfidence === "number" ? rawConfidence : 0;

    const reasoning =
      typeof output["reasoning"] === "string" && output["reasoning"].trim().length > 0
        ? output["reasoning"].trim()
        : null;

    return {
      documentType: normalized,
      confidence: Math.max(0, Math.min(1, confidence)),
      reasoning
    };
  }

  private parseClassificationSuggestionJson(json: Prisma.JsonValue): {
    documentType: DocumentType;
  } {
    if (!json || typeof json !== "object" || Array.isArray(json)) {
      return { documentType: "unknown" };
    }

    const node = json as Record<string, unknown>;
    const rawType = typeof node["documentType"] === "string" ? node["documentType"] : "";
    return { documentType: this.normalizeDocumentType(rawType) };
  }

  private normalizeDocumentType(raw: string): DocumentType {
    const t = raw.trim().toLowerCase();
    if (t === "invoice") return "invoice";
    if (t === "lease") return "lease";
    if (t === "contract") return "contract";
    return "unknown";
  }

  private parseInvoiceExtractionOutput(output: Record<string, unknown>): Record<string, unknown> & {
    confidence: number;
  } {
    const rawConfidence = output["confidence"];
    const confidence = typeof rawConfidence === "number" ? rawConfidence : 0;

    // Keep the extraction schema permissive for now; we store whatever the provider returns
    // (plus a normalized confidence) for auditability.
    return {
      ...output,
      confidence: Math.max(0, Math.min(1, confidence))
    };
  }

  private async requireScopedDocument(documentId: string, organizationId: string) {
    const doc = await this.documentsRepository.findByIdScoped(documentId, organizationId);
    if (!doc) {
      throw new NotFoundException("Document not found");
    }
    return doc;
  }
}

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException
} from "@nestjs/common";
import {
  DocumentIngestionStatus,
  DocumentLinkedEntityType,
} from "@prisma/client";
import { AuditService } from "../../audit/services/audit.service";
import { DocumentFiltersDto } from "../dto/document-filters.dto";
import { LinkDocumentDto } from "../dto/link-document.dto";
import { ReprocessDocumentDto } from "../dto/reprocess-document.dto";
import { UpdateDocumentDto } from "../dto/update-document.dto";
import { UploadDocumentDto } from "../dto/upload-document.dto";
import { DocumentMapper } from "../mappers/document.mapper";
import { AttachmentsRepository } from "../repositories/attachments.repository";
import { DocumentsRepository } from "../repositories/documents.repository";
import { AiSuggestionMapper } from "../../ai/mappers/ai-suggestion.mapper";
import { DocumentLinkingService } from "./document-linking.service";
import { DocumentAiService } from "./document-ai.service";
import { DocumentStorageService } from "./document-storage.service";
import { WorkflowFacadeService } from "../../workflows/services/workflow-facade.service";

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly documentsRepository: DocumentsRepository,
    private readonly attachmentsRepository: AttachmentsRepository,
    private readonly documentStorageService: DocumentStorageService,
    private readonly documentLinkingService: DocumentLinkingService,
    private readonly documentAiService: DocumentAiService,
    private readonly auditService: AuditService,
    private readonly workflowFacadeService: WorkflowFacadeService
  ) {}

  async listScoped(organizationId: string, filters: DocumentFiltersDto) {
    const [documents, total] = await Promise.all([
      this.documentsRepository.listByOrganization(organizationId, filters),
      this.documentsRepository.countByOrganization(organizationId, filters)
    ]);

    return {
      data: documents.map(DocumentMapper.toResponse),
      meta: {
        total,
        limit: filters.limit ?? 25,
        offset: filters.offset ?? 0
      }
    };
  }

  async getByIdScoped(organizationId: string, documentId: string) {
    const document = await this.requireScopedDocument(documentId, organizationId);
    return DocumentMapper.toResponse(document);
  }

  async uploadScoped(params: {
    organizationId: string;
    actorUserId: string;
    file: { originalname: string; mimetype?: string; size?: number; buffer: Buffer };
    dto: UploadDocumentDto;
    requestId?: string;
  }) {
    const { organizationId, actorUserId, file, dto, requestId } = params;
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException("File upload payload is required");
    }

    if (
      (dto.linkedEntityType && !dto.linkedEntityId) ||
      (!dto.linkedEntityType && dto.linkedEntityId)
    ) {
      throw new BadRequestException(
        "Initial link requires both linkedEntityType and linkedEntityId"
      );
    }
    if (dto.linkedEntityType && dto.linkedEntityId) {
      await this.documentLinkingService.validateLinkTarget(
        organizationId,
        dto.linkedEntityType,
        dto.linkedEntityId
      );
    }
    if (
      (dto.attachmentContextType && !dto.attachmentContextId) ||
      (!dto.attachmentContextType && dto.attachmentContextId)
    ) {
      throw new BadRequestException(
        "Attachment metadata requires both attachmentContextType and attachmentContextId"
      );
    }

    const stored = await this.documentStorageService.storeFile({
      fileName: file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer
    });

    const document = await this.documentsRepository.create({
      organization: { connect: { id: organizationId } },
      storageKey: stored.storageKey,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSizeBytes: file.size,
      sourceType: dto.sourceType,
      sourceReference: dto.sourceReference,
      documentType: dto.documentType,
      ingestionStatus: DocumentIngestionStatus.UPLOADED,
      checksumSha256: stored.checksumSha256,
      uploadedByUser: { connect: { id: actorUserId } }
    });

    if (dto.linkedEntityType && dto.linkedEntityId) {
      await this.documentLinkingService.createLink({
        organizationId,
        actorUserId,
        documentId: document.id,
        linkedEntityType: dto.linkedEntityType as DocumentLinkedEntityType,
        linkedEntityId: dto.linkedEntityId,
        linkRole: dto.linkRole,
        requestId
      });
    }

    if (dto.attachmentContextType && dto.attachmentContextId) {
      await this.attachmentsRepository.create({
        document: { connect: { id: document.id } },
        attachmentContextType: dto.attachmentContextType,
        attachmentContextId: dto.attachmentContextId
      });
    }

    const withLinks = await this.requireScopedDocument(document.id, organizationId);
    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "document.upload",
      entityType: "Document",
      entityId: document.id,
      newValues: DocumentMapper.toResponse(withLinks),
      metadata: { requestId }
    });
    try {
      await this.workflowFacadeService.startDocumentIngestionWorkflow({
        organizationId,
        documentId: document.id,
        actorUserId,
        requestId
      });
    } catch (error) {
      this.logger.warn(
        `Document workflow visibility hook failed for documentId=${document.id}: ${error instanceof Error ? error.message : "unknown error"}`
      );
    }

    // Assistive-only: classification/extraction runs create auditable suggestions but never mutate the document.
    // We keep this non-blocking for the upload happy-path.
    try {
      await this.documentAiService.runAssistiveClassificationAndMaybeExtraction({
        organizationId,
        actorUserId,
        documentId: document.id,
        trigger: "upload",
        requestId
      });
    } catch (error) {
      this.logger.warn(
        `Document AI assist failed for documentId=${document.id}: ${error instanceof Error ? error.message : "unknown error"}`
      );
    }

    return DocumentMapper.toResponse(withLinks);
  }

  async updateScoped(params: {
    organizationId: string;
    documentId: string;
    actorUserId: string;
    dto: UpdateDocumentDto;
    requestId?: string;
  }) {
    const { organizationId, documentId, actorUserId, dto, requestId } = params;
    const existing = await this.requireScopedDocument(documentId, organizationId);

    const updated = await this.documentsRepository.update(documentId, {
      documentType: dto.documentType,
      sourceType: dto.sourceType,
      sourceReference: dto.sourceReference
    });

    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "document.update_metadata",
      entityType: "Document",
      entityId: updated.id,
      oldValues: DocumentMapper.toResponse(existing),
      newValues: DocumentMapper.toResponse(updated),
      metadata: { requestId }
    });

    return DocumentMapper.toResponse(updated);
  }

  async getDownloadScoped(organizationId: string, documentId: string) {
    const document = await this.requireScopedDocument(documentId, organizationId);
    const resolved = await this.documentStorageService.resolveForDownload(
      document.storageKey
    );
    return {
      absolutePath: resolved.absolutePath,
      fileName: document.fileName
    };
  }

  async listLinksScoped(organizationId: string, documentId: string) {
    await this.requireScopedDocument(documentId, organizationId);
    const links = await this.documentLinkingService.listLinks(documentId);
    return {
      data: links,
      meta: { total: links.length }
    };
  }

  async createLinkScoped(params: {
    organizationId: string;
    documentId: string;
    actorUserId: string;
    dto: LinkDocumentDto;
    requestId?: string;
  }) {
    const { organizationId, documentId, actorUserId, dto, requestId } = params;
    await this.requireScopedDocument(documentId, organizationId);
    return this.documentLinkingService.createLink({
      organizationId,
      actorUserId,
      documentId,
      linkedEntityType: dto.linkedEntityType,
      linkedEntityId: dto.linkedEntityId,
      linkRole: dto.linkRole,
      requestId
    });
  }

  async deleteLinkScoped(params: {
    organizationId: string;
    documentId: string;
    actorUserId: string;
    dto: LinkDocumentDto;
    requestId?: string;
  }) {
    const { organizationId, documentId, actorUserId, dto, requestId } = params;
    await this.requireScopedDocument(documentId, organizationId);
    return this.documentLinkingService.deleteLink({
      organizationId,
      actorUserId,
      documentId,
      linkedEntityType: dto.linkedEntityType,
      linkedEntityId: dto.linkedEntityId,
      requestId
    });
  }

  async reprocessScoped(params: {
    organizationId: string;
    documentId: string;
    actorUserId: string;
    dto: ReprocessDocumentDto;
    requestId?: string;
  }) {
    const { organizationId, documentId, actorUserId, dto, requestId } = params;
    const existing = await this.requireScopedDocument(documentId, organizationId);
    const updated = await this.documentsRepository.setIngestionStatus(
      documentId,
      DocumentIngestionStatus.REPROCESSING_REQUESTED
    );
    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "document.reprocess_requested",
      entityType: "Document",
      entityId: documentId,
      oldValues: DocumentMapper.toResponse(existing),
      newValues: DocumentMapper.toResponse(updated),
      metadata: { requestId, note: dto.note }
    });

    // Treat reprocess as a manual trigger: we can re-run assistive AI and (when relevant) invoice extraction.
    try {
      await this.documentAiService.runAssistiveClassificationAndMaybeExtraction({
        organizationId,
        actorUserId,
        documentId,
        trigger: "reprocess",
        requestId
      });
    } catch (error) {
      this.logger.warn(
        `Document AI assist failed during reprocess for documentId=${documentId}: ${error instanceof Error ? error.message : "unknown error"}`
      );
    }
    return DocumentMapper.toResponse(updated);
  }

  async listAiSuggestionsScoped(params: {
    organizationId: string;
    documentId: string;
    limit?: number;
  }) {
    const suggestions = await this.documentAiService.listDocumentSuggestions(params);
    const classification = suggestions.classification.map(AiSuggestionMapper.toResponse);
    const extraction = suggestions.extraction.map(AiSuggestionMapper.toResponse);
    return {
      data: {
        classification,
        extraction
      },
      meta: {
        total: classification.length + extraction.length
      }
    };
  }

  async applyClassificationSuggestionScoped(params: {
    organizationId: string;
    documentId: string;
    actorUserId: string;
    suggestionId: string;
    requestId?: string;
    note?: string;
  }) {
    const result = await this.documentAiService.applyClassificationSuggestion(params);
    return {
      data: {
        document: DocumentMapper.toResponse(result.document),
        suggestionId: result.suggestionId
      }
    };
  }

  async applyExtractionSuggestionScoped(params: {
    organizationId: string;
    documentId: string;
    actorUserId: string;
    suggestionId: string;
    requestId?: string;
    note?: string;
  }) {
    const result = await this.documentAiService.applyExtractionSuggestion(params);
    return {
      data: result
    };
  }

  private async requireScopedDocument(documentId: string, organizationId: string) {
    const document = await this.documentsRepository.findByIdScoped(
      documentId,
      organizationId
    );
    if (!document) {
      throw new NotFoundException("Document not found");
    }
    return document;
  }
}

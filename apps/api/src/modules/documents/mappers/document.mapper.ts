import { Injectable } from "@nestjs/common";
import { Document, DocumentLink } from "@prisma/client";

type DocumentResponse = {
  id: string;
  organizationId: string;
  storageKey: string;
  fileName: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  sourceType: string | null;
  sourceReference: string | null;
  documentType: string | null;
  ingestionStatus: string;
  checksumSha256: string | null;
  uploadedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  links?: {
    linkedEntityType: string;
    linkedEntityId: string;
    linkRole: string | null;
    createdAt: Date;
  }[];
};

@Injectable()
export class DocumentMapper {
  static toResponse(
    document: Document & { links?: DocumentLink[] }
  ): DocumentResponse {
    return {
      id: document.id,
      organizationId: document.organizationId,
      storageKey: document.storageKey,
      fileName: document.fileName,
      mimeType: document.mimeType,
      fileSizeBytes: document.fileSizeBytes,
      sourceType: document.sourceType,
      sourceReference: document.sourceReference,
      documentType: document.documentType,
      ingestionStatus: document.ingestionStatus,
      checksumSha256: document.checksumSha256,
      uploadedByUserId: document.uploadedByUserId,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      links: document.links?.map((link) => ({
        linkedEntityType: link.linkedEntityType,
        linkedEntityId: link.linkedEntityId,
        linkRole: link.linkRole,
        createdAt: link.createdAt
      }))
    };
  }
}


import { Injectable } from "@nestjs/common";
import {
  Document,
  DocumentIngestionStatus,
  Prisma
} from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";
import { DocumentFiltersDto } from "../dto/document-filters.dto";

@Injectable()
export class DocumentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByOrganization(
    organizationId: string,
    filters: DocumentFiltersDto
  ) {
    return this.prisma.document.findMany({
      where: {
        organizationId,
        documentType: filters.documentType,
        ingestionStatus: filters.ingestionStatus,
        uploadedByUserId: filters.uploadedByUserId,
        createdAt:
          filters.createdFrom || filters.createdTo
            ? {
                gte: filters.createdFrom
                  ? new Date(filters.createdFrom)
                  : undefined,
                lte: filters.createdTo ? new Date(filters.createdTo) : undefined
              }
            : undefined,
        links:
          filters.linkedEntityType || filters.linkedEntityId
            ? {
                some: {
                  linkedEntityType: filters.linkedEntityType,
                  linkedEntityId: filters.linkedEntityId
                }
              }
            : undefined,
        OR: filters.search
          ? [
              { fileName: { contains: filters.search, mode: "insensitive" } },
              { sourceReference: { contains: filters.search, mode: "insensitive" } }
            ]
          : undefined
      },
      include: {
        links: true
      },
      orderBy: { createdAt: "desc" },
      skip: filters.offset,
      take: filters.limit
    });
  }

  countByOrganization(
    organizationId: string,
    filters: DocumentFiltersDto
  ): Promise<number> {
    return this.prisma.document.count({
      where: {
        organizationId,
        documentType: filters.documentType,
        ingestionStatus: filters.ingestionStatus,
        uploadedByUserId: filters.uploadedByUserId,
        createdAt:
          filters.createdFrom || filters.createdTo
            ? {
                gte: filters.createdFrom
                  ? new Date(filters.createdFrom)
                  : undefined,
                lte: filters.createdTo ? new Date(filters.createdTo) : undefined
              }
            : undefined,
        links:
          filters.linkedEntityType || filters.linkedEntityId
            ? {
                some: {
                  linkedEntityType: filters.linkedEntityType,
                  linkedEntityId: filters.linkedEntityId
                }
              }
            : undefined,
        OR: filters.search
          ? [
              { fileName: { contains: filters.search, mode: "insensitive" } },
              { sourceReference: { contains: filters.search, mode: "insensitive" } }
            ]
          : undefined
      }
    });
  }

  findByIdScoped(documentId: string, organizationId: string) {
    return this.prisma.document.findFirst({
      where: { id: documentId, organizationId },
      include: { links: true }
    });
  }

  create(data: Prisma.DocumentCreateInput): Promise<Document> {
    return this.prisma.document.create({ data });
  }

  update(
    documentId: string,
    data: Prisma.DocumentUpdateInput
  ): Promise<Document> {
    return this.prisma.document.update({
      where: { id: documentId },
      data
    });
  }

  setIngestionStatus(
    documentId: string,
    ingestionStatus: DocumentIngestionStatus
  ): Promise<Document> {
    return this.prisma.document.update({
      where: { id: documentId },
      data: { ingestionStatus }
    });
  }
}

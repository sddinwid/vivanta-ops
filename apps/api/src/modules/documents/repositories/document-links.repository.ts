import { Injectable } from "@nestjs/common";
import {
  DocumentLinkedEntityType,
  DocumentLink,
  Prisma
} from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";

@Injectable()
export class DocumentLinksRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByDocument(documentId: string): Promise<DocumentLink[]> {
    return this.prisma.documentLink.findMany({
      where: { documentId },
      orderBy: { createdAt: "desc" }
    });
  }

  findLink(
    documentId: string,
    linkedEntityType: DocumentLinkedEntityType,
    linkedEntityId: string
  ): Promise<DocumentLink | null> {
    return this.prisma.documentLink.findUnique({
      where: {
        documentId_linkedEntityType_linkedEntityId: {
          documentId,
          linkedEntityType,
          linkedEntityId
        }
      }
    });
  }

  create(data: Prisma.DocumentLinkCreateInput): Promise<DocumentLink> {
    return this.prisma.documentLink.create({ data });
  }

  delete(
    documentId: string,
    linkedEntityType: DocumentLinkedEntityType,
    linkedEntityId: string
  ): Promise<DocumentLink> {
    return this.prisma.documentLink.delete({
      where: {
        documentId_linkedEntityType_linkedEntityId: {
          documentId,
          linkedEntityType,
          linkedEntityId
        }
      }
    });
  }
}


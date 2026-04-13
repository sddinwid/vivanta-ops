import { Injectable } from "@nestjs/common";
import { MessageAttachment } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";

@Injectable()
export class MessageAttachmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(messageId: string, documentIds: string[]): Promise<void> {
    if (documentIds.length === 0) {
      return;
    }
    await this.prisma.messageAttachment.createMany({
      data: documentIds.map((documentId) => ({ messageId, documentId })),
      skipDuplicates: true
    });
  }

  listByMessage(messageId: string): Promise<MessageAttachment[]> {
    return this.prisma.messageAttachment.findMany({
      where: { messageId },
      orderBy: { createdAt: "asc" }
    });
  }

  findDocumentsByOrganization(documentIds: string[], organizationId: string) {
    return this.prisma.document.findMany({
      where: { id: { in: documentIds }, organizationId },
      select: { id: true }
    });
  }
}


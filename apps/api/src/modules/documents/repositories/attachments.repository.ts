import { Injectable } from "@nestjs/common";
import { Attachment, Prisma } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";

@Injectable()
export class AttachmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.AttachmentCreateInput): Promise<Attachment> {
    return this.prisma.attachment.create({ data });
  }

  listByDocument(documentId: string): Promise<Attachment[]> {
    return this.prisma.attachment.findMany({
      where: { documentId },
      orderBy: { createdAt: "desc" }
    });
  }
}


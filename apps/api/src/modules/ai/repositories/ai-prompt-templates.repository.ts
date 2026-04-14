import { Injectable } from "@nestjs/common";
import { AiCapability, AiPromptTemplate, Prisma } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";

@Injectable()
export class AiPromptTemplatesRepository {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.aiPromptTemplate.findMany({
      orderBy: [{ templateKey: "asc" }, { version: "desc" }]
    });
  }

  create(data: Prisma.AiPromptTemplateCreateInput): Promise<AiPromptTemplate> {
    return this.prisma.aiPromptTemplate.create({ data });
  }

  findById(templateId: string): Promise<AiPromptTemplate | null> {
    return this.prisma.aiPromptTemplate.findUnique({ where: { id: templateId } });
  }

  update(
    templateId: string,
    data: Prisma.AiPromptTemplateUpdateInput
  ): Promise<AiPromptTemplate> {
    return this.prisma.aiPromptTemplate.update({
      where: { id: templateId },
      data
    });
  }

  findActiveByCapability(capability: AiCapability): Promise<AiPromptTemplate | null> {
    return this.prisma.aiPromptTemplate.findFirst({
      where: {
        capability,
        isActive: true
      },
      orderBy: [{ version: "desc" }, { updatedAt: "desc" }]
    });
  }

  findActiveByTemplateKey(templateKey: string): Promise<AiPromptTemplate | null> {
    return this.prisma.aiPromptTemplate.findFirst({
      where: {
        templateKey,
        isActive: true
      },
      orderBy: [{ version: "desc" }, { updatedAt: "desc" }]
    });
  }
}

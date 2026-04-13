import { Injectable, NotFoundException } from "@nestjs/common";
import { AiCapability } from "@prisma/client";
import { CreatePromptTemplateDto } from "../dto/create-prompt-template.dto";
import { UpdatePromptTemplateDto } from "../dto/update-prompt-template.dto";
import { AiPromptTemplatesRepository } from "../repositories/ai-prompt-templates.repository";

@Injectable()
export class AiPromptService {
  constructor(
    private readonly aiPromptTemplatesRepository: AiPromptTemplatesRepository
  ) {}

  listTemplates() {
    return this.aiPromptTemplatesRepository.list();
  }

  createTemplate(dto: CreatePromptTemplateDto) {
    return this.aiPromptTemplatesRepository.create({
      templateKey: dto.templateKey,
      capability: dto.capability,
      version: dto.version,
      systemPrompt: dto.systemPrompt,
      userPromptTemplate: dto.userPromptTemplate,
      isActive: dto.isActive ?? true
    });
  }

  async updateTemplate(templateId: string, dto: UpdatePromptTemplateDto) {
    const existing = await this.aiPromptTemplatesRepository.findById(templateId);
    if (!existing) {
      throw new NotFoundException("AI prompt template not found");
    }

    return this.aiPromptTemplatesRepository.update(templateId, {
      templateKey: dto.templateKey,
      capability: dto.capability,
      version: dto.version,
      systemPrompt: dto.systemPrompt,
      userPromptTemplate: dto.userPromptTemplate,
      isActive: dto.isActive
    });
  }

  async resolvePromptTemplate(params: { capability: AiCapability; templateId?: string }) {
    if (params.templateId) {
      const byId = await this.aiPromptTemplatesRepository.findById(params.templateId);
      if (!byId) {
        throw new NotFoundException("AI prompt template not found");
      }
      return byId;
    }
    return this.aiPromptTemplatesRepository.findActiveByCapability(params.capability);
  }
}

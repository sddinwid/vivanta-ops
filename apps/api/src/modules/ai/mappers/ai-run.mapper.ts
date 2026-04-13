import { AiPromptTemplate, AiRun, AiSuggestion } from "@prisma/client";

type AiRunWithRelations = AiRun & {
  promptTemplate?: AiPromptTemplate | null;
  suggestions?: AiSuggestion[];
};

export class AiRunMapper {
  static toResponse(run: AiRunWithRelations) {
    return {
      id: run.id,
      organizationId: run.organizationId,
      capability: run.capability,
      providerName: run.providerName,
      modelName: run.modelName,
      promptTemplateId: run.promptTemplateId,
      promptTemplate: run.promptTemplate
        ? {
            id: run.promptTemplate.id,
            templateKey: run.promptTemplate.templateKey,
            version: run.promptTemplate.version,
            capability: run.promptTemplate.capability,
            isActive: run.promptTemplate.isActive
          }
        : null,
      targetEntityType: run.targetEntityType,
      targetEntityId: run.targetEntityId,
      status: run.status,
      inputJson: run.inputJson,
      outputJson: run.outputJson,
      confidenceScore: run.confidenceScore,
      latencyMs: run.latencyMs,
      errorCode: run.errorCode,
      errorMessage: run.errorMessage,
      createdByUserId: run.createdByUserId,
      suggestionCount: run.suggestions?.length,
      createdAt: run.createdAt,
      completedAt: run.completedAt
    };
  }
}

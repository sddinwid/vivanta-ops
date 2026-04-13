import { AiSuggestion } from "@prisma/client";

export class AiSuggestionMapper {
  static toResponse(suggestion: AiSuggestion) {
    return {
      id: suggestion.id,
      aiRunId: suggestion.aiRunId,
      suggestionType: suggestion.suggestionType,
      targetEntityType: suggestion.targetEntityType,
      targetEntityId: suggestion.targetEntityId,
      suggestionJson: suggestion.suggestionJson,
      confidenceScore: suggestion.confidenceScore,
      isApplied: suggestion.isApplied,
      appliedAt: suggestion.appliedAt,
      appliedByUserId: suggestion.appliedByUserId,
      createdAt: suggestion.createdAt
    };
  }
}

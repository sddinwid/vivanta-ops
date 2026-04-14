import { AiEvaluation } from "@prisma/client";

export class AiEvaluationMapper {
  static toResponse(evaluation: AiEvaluation) {
    return {
      id: evaluation.id,
      organizationId: evaluation.organizationId,
      aiRunId: evaluation.aiRunId,
      aiSuggestionId: evaluation.aiSuggestionId,
      targetEntityType: evaluation.targetEntityType,
      targetEntityId: evaluation.targetEntityId,
      evaluatorUserId: evaluation.evaluatorUserId,
      outcome: evaluation.outcome,
      score: evaluation.score,
      notes: evaluation.notes,
      metadataJson: evaluation.metadataJson,
      createdAt: evaluation.createdAt
    };
  }
}


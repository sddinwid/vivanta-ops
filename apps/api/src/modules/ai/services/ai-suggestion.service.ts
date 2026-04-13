import { Injectable, NotFoundException } from "@nestjs/common";
import { AiSuggestionMapper } from "../mappers/ai-suggestion.mapper";
import { AiRunsRepository } from "../repositories/ai-runs.repository";
import { AiSuggestionsRepository } from "../repositories/ai-suggestions.repository";
import { ApplyAiSuggestionDto } from "../dto/apply-ai-suggestion.dto";

@Injectable()
export class AiSuggestionService {
  constructor(
    private readonly aiRunsRepository: AiRunsRepository,
    private readonly aiSuggestionsRepository: AiSuggestionsRepository
  ) {}

  async listRunSuggestions(organizationId: string, aiRunId: string) {
    const run = await this.aiRunsRepository.findByIdScoped(aiRunId, organizationId);
    if (!run) {
      throw new NotFoundException("AI run not found");
    }

    const suggestions = await this.aiSuggestionsRepository.listByRunId(aiRunId);
    return {
      data: suggestions.map(AiSuggestionMapper.toResponse),
      meta: { total: suggestions.length }
    };
  }

  async applySuggestion(params: {
    organizationId: string;
    suggestionId: string;
    appliedByUserId: string;
    dto: ApplyAiSuggestionDto;
  }) {
    const { organizationId, suggestionId, appliedByUserId } = params;
    const existing = await this.aiSuggestionsRepository.findByIdScoped(
      suggestionId,
      organizationId
    );
    if (!existing) {
      throw new NotFoundException("AI suggestion not found");
    }

    if (existing.isApplied) {
      return {
        suggestion: AiSuggestionMapper.toResponse(existing),
        appliedNow: false
      };
    }

    const updated = await this.aiSuggestionsRepository.update(suggestionId, {
      isApplied: true,
      appliedAt: new Date(),
      appliedByUser: { connect: { id: appliedByUserId } }
    });

    return {
      suggestion: AiSuggestionMapper.toResponse(updated),
      appliedNow: true
    };
  }
}

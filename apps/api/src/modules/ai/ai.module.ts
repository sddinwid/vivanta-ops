import { Module } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { PrismaModule } from "../../database/prisma/prisma.module";
import { AuditModule } from "../audit/audit.module";
import { AiController } from "./controllers/ai.controller";
import { AiRunMapper } from "./mappers/ai-run.mapper";
import { AiSuggestionMapper } from "./mappers/ai-suggestion.mapper";
import { AiEvaluationMapper } from "./mappers/ai-evaluation.mapper";
import { AiProviderConfigsRepository } from "./repositories/ai-provider-configs.repository";
import { AiEvaluationsRepository } from "./repositories/ai-evaluations.repository";
import { AiPromptTemplatesRepository } from "./repositories/ai-prompt-templates.repository";
import { AiRunsRepository } from "./repositories/ai-runs.repository";
import { AiSuggestionsRepository } from "./repositories/ai-suggestions.repository";
import { AiProviderService } from "./services/ai-provider.service";
import { AiPromptService } from "./services/ai-prompt.service";
import { AiService } from "./services/ai.service";
import { AiSuggestionService } from "./services/ai-suggestion.service";
import { StubAiProviderService } from "./services/stub-ai-provider.service";

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [AiController],
  providers: [
    AiService,
    AiProviderService,
    AiPromptService,
    AiSuggestionService,
    StubAiProviderService,
    AiRunsRepository,
    AiSuggestionsRepository,
    AiEvaluationsRepository,
    AiProviderConfigsRepository,
    AiPromptTemplatesRepository,
    AiRunMapper,
    AiSuggestionMapper,
    AiEvaluationMapper,
    JwtAuthGuard,
    PermissionsGuard
  ],
  exports: [
    AiProviderService,
    AiPromptService,
    AiRunsRepository,
    AiSuggestionsRepository
  ]
})
export class AiModule {}

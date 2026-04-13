import { Module } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { PrismaModule } from "../../database/prisma/prisma.module";
import { AuditModule } from "../audit/audit.module";
import { AiController } from "./controllers/ai.controller";
import { AiRunMapper } from "./mappers/ai-run.mapper";
import { AiSuggestionMapper } from "./mappers/ai-suggestion.mapper";
import { AiProviderConfigsRepository } from "./repositories/ai-provider-configs.repository";
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
    AiProviderConfigsRepository,
    AiPromptTemplatesRepository,
    AiRunMapper,
    AiSuggestionMapper,
    JwtAuthGuard,
    PermissionsGuard
  ]
})
export class AiModule {}

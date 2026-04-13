import { Injectable } from "@nestjs/common";
import { AiSuggestion, Prisma } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";

@Injectable()
export class AiSuggestionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByRunId(aiRunId: string): Promise<AiSuggestion[]> {
    return this.prisma.aiSuggestion.findMany({
      where: { aiRunId },
      orderBy: { createdAt: "asc" }
    });
  }

  create(data: Prisma.AiSuggestionCreateInput): Promise<AiSuggestion> {
    return this.prisma.aiSuggestion.create({ data });
  }

  createMany(data: Prisma.AiSuggestionCreateManyInput[]): Promise<void> {
    return this.prisma.aiSuggestion
      .createMany({
        data,
        skipDuplicates: true
      })
      .then(() => undefined);
  }

  findByIdScoped(suggestionId: string, organizationId: string) {
    return this.prisma.aiSuggestion.findFirst({
      where: {
        id: suggestionId,
        aiRun: {
          organizationId
        }
      },
      include: {
        aiRun: true
      }
    });
  }

  update(suggestionId: string, data: Prisma.AiSuggestionUpdateInput): Promise<AiSuggestion> {
    return this.prisma.aiSuggestion.update({
      where: { id: suggestionId },
      data
    });
  }
}

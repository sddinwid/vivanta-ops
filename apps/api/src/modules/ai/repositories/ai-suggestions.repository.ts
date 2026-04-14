import { Injectable } from "@nestjs/common";
import { AiSuggestion, Prisma } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";

@Injectable()
export class AiSuggestionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByOrganization(params: {
    organizationId: string;
    suggestionType?: Prisma.AiSuggestionWhereInput["suggestionType"];
    isApplied?: boolean;
    targetEntityType?: string;
    targetEntityId?: string;
    createdFrom?: string;
    createdTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<AiSuggestion[]> {
    return this.prisma.aiSuggestion.findMany({
      where: {
        suggestionType: params.suggestionType,
        isApplied: params.isApplied,
        targetEntityType: params.targetEntityType,
        targetEntityId: params.targetEntityId,
        createdAt:
          params.createdFrom || params.createdTo
            ? {
                gte: params.createdFrom ? new Date(params.createdFrom) : undefined,
                lte: params.createdTo ? new Date(params.createdTo) : undefined
              }
            : undefined,
        aiRun: {
          organizationId: params.organizationId
        }
      },
      include: {
        aiRun: true
      },
      orderBy: { createdAt: "desc" },
      skip: params.offset,
      take: params.limit ?? 25
    });
  }

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

  listByTargetEntityScoped(params: {
    organizationId: string;
    targetEntityType: string;
    targetEntityId: string;
    suggestionTypes?: Prisma.AiSuggestionWhereInput["suggestionType"];
    limit?: number;
  }): Promise<AiSuggestion[]> {
    return this.prisma.aiSuggestion.findMany({
      where: {
        targetEntityType: params.targetEntityType,
        targetEntityId: params.targetEntityId,
        suggestionType: params.suggestionTypes,
        aiRun: {
          organizationId: params.organizationId
        }
      },
      orderBy: { createdAt: "desc" },
      take: params.limit ?? 100
    });
  }

  update(suggestionId: string, data: Prisma.AiSuggestionUpdateInput): Promise<AiSuggestion> {
    return this.prisma.aiSuggestion.update({
      where: { id: suggestionId },
      data
    });
  }
}

import { Injectable } from "@nestjs/common";
import { AiEvaluation, Prisma } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";

@Injectable()
export class AiEvaluationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByRunIdScoped(organizationId: string, aiRunId: string): Promise<AiEvaluation[]> {
    return this.prisma.aiEvaluation.findMany({
      where: {
        aiRunId,
        organizationId
      },
      orderBy: { createdAt: "desc" }
    });
  }

  listBySuggestionIdScoped(
    organizationId: string,
    aiSuggestionId: string
  ): Promise<AiEvaluation[]> {
    return this.prisma.aiEvaluation.findMany({
      where: {
        aiSuggestionId,
        organizationId
      },
      orderBy: { createdAt: "desc" }
    });
  }

  create(data: Prisma.AiEvaluationCreateInput): Promise<AiEvaluation> {
    return this.prisma.aiEvaluation.create({ data });
  }
}


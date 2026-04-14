-- CreateEnum
CREATE TYPE "AiEvaluationOutcome" AS ENUM ('POSITIVE', 'NEGATIVE', 'MIXED', 'NEEDS_REVIEW');

-- CreateTable
CREATE TABLE "AiEvaluation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "aiRunId" TEXT NOT NULL,
    "aiSuggestionId" TEXT,
    "targetEntityType" TEXT,
    "targetEntityId" TEXT,
    "evaluatorUserId" TEXT,
    "outcome" "AiEvaluationOutcome" NOT NULL,
    "score" DOUBLE PRECISION,
    "notes" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiEvaluation_organizationId_idx" ON "AiEvaluation"("organizationId");

-- CreateIndex
CREATE INDEX "AiEvaluation_aiRunId_idx" ON "AiEvaluation"("aiRunId");

-- CreateIndex
CREATE INDEX "AiEvaluation_aiSuggestionId_idx" ON "AiEvaluation"("aiSuggestionId");

-- CreateIndex
CREATE INDEX "AiEvaluation_targetEntityType_targetEntityId_idx" ON "AiEvaluation"("targetEntityType", "targetEntityId");

-- AddForeignKey
ALTER TABLE "AiEvaluation" ADD CONSTRAINT "AiEvaluation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiEvaluation" ADD CONSTRAINT "AiEvaluation_aiRunId_fkey" FOREIGN KEY ("aiRunId") REFERENCES "AiRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiEvaluation" ADD CONSTRAINT "AiEvaluation_aiSuggestionId_fkey" FOREIGN KEY ("aiSuggestionId") REFERENCES "AiSuggestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiEvaluation" ADD CONSTRAINT "AiEvaluation_evaluatorUserId_fkey" FOREIGN KEY ("evaluatorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- CreateEnum
CREATE TYPE "AiCapability" AS ENUM (
  'GENERAL',
  'DOCUMENT_ANALYSIS',
  'INVOICE_ANALYSIS',
  'COMMUNICATION_ASSIST',
  'CASE_ASSIST',
  'APPROVAL_ASSIST'
);

-- CreateEnum
CREATE TYPE "AiRunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AiSuggestionType" AS ENUM (
  'GENERIC',
  'FIELD_EXTRACTION',
  'CLASSIFICATION',
  'ACTION_RECOMMENDATION'
);

-- CreateTable
CREATE TABLE "AiProviderConfig" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "providerName" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "capability" "AiCapability" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "settingsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiPromptTemplate" (
    "id" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "capability" "AiCapability" NOT NULL,
    "version" INTEGER NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "userPromptTemplate" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiPromptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiRun" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "capability" "AiCapability" NOT NULL,
    "providerName" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "promptTemplateId" TEXT,
    "targetEntityType" TEXT,
    "targetEntityId" TEXT,
    "status" "AiRunStatus" NOT NULL DEFAULT 'PENDING',
    "inputJson" JSONB,
    "outputJson" JSONB,
    "confidenceScore" DOUBLE PRECISION,
    "latencyMs" INTEGER,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AiRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSuggestion" (
    "id" TEXT NOT NULL,
    "aiRunId" TEXT NOT NULL,
    "suggestionType" "AiSuggestionType" NOT NULL,
    "targetEntityType" TEXT,
    "targetEntityId" TEXT,
    "suggestionJson" JSONB NOT NULL,
    "confidenceScore" DOUBLE PRECISION,
    "isApplied" BOOLEAN NOT NULL DEFAULT false,
    "appliedAt" TIMESTAMP(3),
    "appliedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiProviderConfig_organizationId_idx" ON "AiProviderConfig"("organizationId");

-- CreateIndex
CREATE INDEX "AiProviderConfig_capability_idx" ON "AiProviderConfig"("capability");

-- CreateIndex
CREATE UNIQUE INDEX "AiPromptTemplate_templateKey_version_key" ON "AiPromptTemplate"("templateKey", "version");

-- CreateIndex
CREATE INDEX "AiPromptTemplate_capability_isActive_idx" ON "AiPromptTemplate"("capability", "isActive");

-- CreateIndex
CREATE INDEX "AiRun_organizationId_idx" ON "AiRun"("organizationId");

-- CreateIndex
CREATE INDEX "AiRun_capability_idx" ON "AiRun"("capability");

-- CreateIndex
CREATE INDEX "AiRun_status_idx" ON "AiRun"("status");

-- CreateIndex
CREATE INDEX "AiRun_targetEntityType_targetEntityId_idx" ON "AiRun"("targetEntityType", "targetEntityId");

-- CreateIndex
CREATE INDEX "AiSuggestion_aiRunId_idx" ON "AiSuggestion"("aiRunId");

-- CreateIndex
CREATE INDEX "AiSuggestion_targetEntityType_targetEntityId_idx" ON "AiSuggestion"("targetEntityType", "targetEntityId");

-- AddForeignKey
ALTER TABLE "AiProviderConfig" ADD CONSTRAINT "AiProviderConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRun" ADD CONSTRAINT "AiRun_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRun" ADD CONSTRAINT "AiRun_promptTemplateId_fkey" FOREIGN KEY ("promptTemplateId") REFERENCES "AiPromptTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRun" ADD CONSTRAINT "AiRun_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSuggestion" ADD CONSTRAINT "AiSuggestion_aiRunId_fkey" FOREIGN KEY ("aiRunId") REFERENCES "AiRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSuggestion" ADD CONSTRAINT "AiSuggestion_appliedByUserId_fkey" FOREIGN KEY ("appliedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

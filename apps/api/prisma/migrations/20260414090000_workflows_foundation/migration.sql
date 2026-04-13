-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('RUNNING', 'WAITING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkflowOrchestrationProvider" AS ENUM ('TEMPORAL_STUB', 'TEMPORAL');

-- CreateTable
CREATE TABLE "WorkflowRun" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workflowType" TEXT NOT NULL,
    "targetEntityType" TEXT,
    "targetEntityId" TEXT,
    "orchestrationProvider" "WorkflowOrchestrationProvider" NOT NULL,
    "orchestrationRunId" TEXT,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "lastHeartbeatAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowEvent" (
    "id" TEXT NOT NULL,
    "workflowRunId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkflowRun_organizationId_idx" ON "WorkflowRun"("organizationId");

-- CreateIndex
CREATE INDEX "WorkflowRun_workflowType_idx" ON "WorkflowRun"("workflowType");

-- CreateIndex
CREATE INDEX "WorkflowRun_status_idx" ON "WorkflowRun"("status");

-- CreateIndex
CREATE INDEX "WorkflowRun_targetEntityType_targetEntityId_idx" ON "WorkflowRun"("targetEntityType", "targetEntityId");

-- CreateIndex
CREATE INDEX "WorkflowEvent_workflowRunId_idx" ON "WorkflowEvent"("workflowRunId");

-- AddForeignKey
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowEvent" ADD CONSTRAINT "WorkflowEvent_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "WorkflowRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

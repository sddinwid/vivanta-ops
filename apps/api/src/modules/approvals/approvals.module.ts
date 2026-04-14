import { Module } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { PrismaModule } from "../../database/prisma/prisma.module";
import { AuditModule } from "../audit/audit.module";
import { AiModule } from "../ai/ai.module";
import { WorkflowsModule } from "../workflows/workflows.module";
import { ApprovalsController } from "./controllers/approvals.controller";
import { ApprovalMapper } from "./mappers/approval.mapper";
import { ApprovalStepsRepository } from "./repositories/approval-steps.repository";
import { ApprovalsRepository } from "./repositories/approvals.repository";
import { ApprovalAiService } from "./services/approval-ai.service";
import { ApprovalsService } from "./services/approvals.service";

@Module({
  imports: [PrismaModule, AuditModule, WorkflowsModule, AiModule],
  controllers: [ApprovalsController],
  providers: [
    ApprovalsService,
    ApprovalAiService,
    ApprovalsRepository,
    ApprovalStepsRepository,
    ApprovalMapper,
    JwtAuthGuard,
    PermissionsGuard
  ],
  exports: [ApprovalsService, ApprovalAiService]
})
export class ApprovalsModule {}

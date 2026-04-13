import { Module } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { PrismaModule } from "../../database/prisma/prisma.module";
import { AuditModule } from "../audit/audit.module";
import { WorkflowsModule } from "../workflows/workflows.module";
import { CasesController } from "./controllers/cases.controller";
import { CaseMapper } from "./mappers/case.mapper";
import { CasesRepository } from "./repositories/cases.repository";
import { CaseAssignmentService } from "./services/case-assignment.service";
import { CaseStatusService } from "./services/case-status.service";
import { CasesService } from "./services/cases.service";

@Module({
  imports: [PrismaModule, AuditModule, WorkflowsModule],
  controllers: [CasesController],
  providers: [
    CasesService,
    CaseAssignmentService,
    CaseStatusService,
    CasesRepository,
    CaseMapper,
    JwtAuthGuard,
    PermissionsGuard
  ],
  exports: [CasesRepository]
})
export class CasesModule {}

import { Module } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { PrismaModule } from "../../database/prisma/prisma.module";
import { AuditModule } from "../audit/audit.module";
import { WorkflowsController } from "./controllers/workflows.controller";
import { WorkflowMapper } from "./mappers/workflow.mapper";
import { WorkflowEventsRepository } from "./repositories/workflow-events.repository";
import { WorkflowsRepository } from "./repositories/workflows.repository";
import { WorkflowFacadeService } from "./services/workflow-facade.service";
import { WorkflowsService } from "./services/workflows.service";
import { TemporalWorkflowFacadeService } from "../../temporal/temporal-workflow-facade.service";

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [WorkflowsController],
  providers: [
    WorkflowsService,
    WorkflowFacadeService,
    WorkflowsRepository,
    WorkflowEventsRepository,
    WorkflowMapper,
    TemporalWorkflowFacadeService,
    JwtAuthGuard,
    PermissionsGuard
  ],
  exports: [WorkflowFacadeService]
})
export class WorkflowsModule {}

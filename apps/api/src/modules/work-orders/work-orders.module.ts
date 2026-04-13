import { Module } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { PrismaModule } from "../../database/prisma/prisma.module";
import { AuditModule } from "../audit/audit.module";
import { WorkOrdersController } from "./controllers/work-orders.controller";
import { WorkOrderMapper } from "./mappers/work-order.mapper";
import { WorkOrdersRepository } from "./repositories/work-orders.repository";
import { WorkOrderAssignmentService } from "./services/work-order-assignment.service";
import { WorkOrderStatusService } from "./services/work-order-status.service";
import { WorkOrdersService } from "./services/work-orders.service";

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [WorkOrdersController],
  providers: [
    WorkOrdersService,
    WorkOrderAssignmentService,
    WorkOrderStatusService,
    WorkOrdersRepository,
    WorkOrderMapper,
    JwtAuthGuard,
    PermissionsGuard
  ]
})
export class WorkOrdersModule {}

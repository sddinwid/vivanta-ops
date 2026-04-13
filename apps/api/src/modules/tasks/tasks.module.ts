import { Module } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { PrismaModule } from "../../database/prisma/prisma.module";
import { AuditModule } from "../audit/audit.module";
import { TasksController } from "./controllers/tasks.controller";
import { TaskMapper } from "./mappers/task.mapper";
import { TasksRepository } from "./repositories/tasks.repository";
import { TasksService } from "./services/tasks.service";

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [TasksController],
  providers: [TasksService, TasksRepository, TaskMapper, JwtAuthGuard, PermissionsGuard]
})
export class TasksModule {}

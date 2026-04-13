import { Module } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { PrismaModule } from "../../database/prisma/prisma.module";
import { AuditController } from "./controllers/audit.controller";
import { AuditRepository } from "./repositories/audit.repository";
import { AuditService } from "./services/audit.service";

@Module({
  imports: [PrismaModule],
  controllers: [AuditController],
  providers: [AuditService, AuditRepository, JwtAuthGuard, PermissionsGuard],
  exports: [AuditService]
})
export class AuditModule {}

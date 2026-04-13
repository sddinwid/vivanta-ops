import { Module } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { PrismaModule } from "../../database/prisma/prisma.module";
import { AuditModule } from "../audit/audit.module";
import { AccessController } from "./controllers/access.controller";
import { AccessRepository } from "./repositories/access.repository";
import { AccessService } from "./services/access.service";

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [AccessController],
  providers: [AccessService, AccessRepository, JwtAuthGuard, PermissionsGuard],
  exports: [AccessService]
})
export class AccessModule {}

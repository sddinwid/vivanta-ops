import { Module } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { PrismaModule } from "../../database/prisma/prisma.module";
import { PortalController } from "./controllers/portal.controller";
import { PortalMapper } from "./mappers/portal.mapper";
import { PortalRepository } from "./repositories/portal.repository";
import { PortalAccessService } from "./services/portal-access.service";
import { PortalService } from "./services/portal.service";

@Module({
  imports: [PrismaModule],
  controllers: [PortalController],
  providers: [
    PortalService,
    PortalAccessService,
    PortalRepository,
    PortalMapper,
    JwtAuthGuard,
    PermissionsGuard
  ]
})
export class PortalModule {}

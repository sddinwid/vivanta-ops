import { Module } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { PrismaModule } from "../../database/prisma/prisma.module";
import { AuditModule } from "../audit/audit.module";
import { OwnersController } from "./controllers/owners.controller";
import { OwnerMapper } from "./mappers/owner.mapper";
import { OwnersRepository } from "./repositories/owners.repository";
import { PropertyOwnerLinksRepository } from "./repositories/property-owner-links.repository";
import { OwnersService } from "./services/owners.service";

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [OwnersController],
  providers: [
    OwnersService,
    OwnersRepository,
    PropertyOwnerLinksRepository,
    OwnerMapper,
    JwtAuthGuard,
    PermissionsGuard
  ]
})
export class OwnersModule {}

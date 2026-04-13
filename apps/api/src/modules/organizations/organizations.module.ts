import { Module } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { PrismaModule } from "../../database/prisma/prisma.module";
import { OrganizationsController } from "./controllers/organizations.controller";
import { OrganizationsRepository } from "./repositories/organizations.repository";
import { OrganizationsService } from "./services/organizations.service";

@Module({
  imports: [PrismaModule],
  controllers: [OrganizationsController],
  providers: [
    OrganizationsService,
    OrganizationsRepository,
    JwtAuthGuard,
    PermissionsGuard
  ],
  exports: [OrganizationsService]
})
export class OrganizationsModule {}

import { Module } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { PrismaModule } from "../../database/prisma/prisma.module";
import { AuditModule } from "../audit/audit.module";
import { VendorsController } from "./controllers/vendors.controller";
import { VendorMapper } from "./mappers/vendor.mapper";
import { VendorsRepository } from "./repositories/vendors.repository";
import { VendorsService } from "./services/vendors.service";

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [VendorsController],
  providers: [
    VendorsService,
    VendorsRepository,
    VendorMapper,
    JwtAuthGuard,
    PermissionsGuard
  ]
})
export class VendorsModule {}

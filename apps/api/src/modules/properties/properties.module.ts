import { Module } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { PrismaModule } from "../../database/prisma/prisma.module";
import { AuditModule } from "../audit/audit.module";
import { BuildingsController } from "./controllers/buildings.controller";
import { PropertiesController } from "./controllers/properties.controller";
import { UnitsController } from "./controllers/units.controller";
import { BuildingMapper } from "./mappers/building.mapper";
import { PropertyMapper } from "./mappers/property.mapper";
import { UnitMapper } from "./mappers/unit.mapper";
import { BuildingsRepository } from "./repositories/buildings.repository";
import { PropertiesRepository } from "./repositories/properties.repository";
import { UnitsRepository } from "./repositories/units.repository";
import { BuildingsService } from "./services/buildings.service";
import { PropertiesService } from "./services/properties.service";
import { UnitsService } from "./services/units.service";

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [PropertiesController, BuildingsController, UnitsController],
  providers: [
    PropertiesService,
    BuildingsService,
    UnitsService,
    PropertiesRepository,
    BuildingsRepository,
    UnitsRepository,
    PropertyMapper,
    BuildingMapper,
    UnitMapper,
    JwtAuthGuard,
    PermissionsGuard
  ]
})
export class PropertiesModule {}

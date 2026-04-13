import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequestIdentity } from "../../../common/request-context/request-context.types";
import { CreateUnitDto } from "../dto/create-unit.dto";
import { UnitFiltersDto } from "../dto/unit-filters.dto";
import { UpdateUnitDto } from "../dto/update-unit.dto";
import { UnitsService } from "../services/units.service";

@Controller("properties/:propertyId/units")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  @RequirePermissions("property.read")
  list(
    @CurrentUser() identity: RequestIdentity,
    @Param("propertyId", new ParseUUIDPipe()) propertyId: string,
    @Query() filters: UnitFiltersDto
  ): Promise<unknown> {
    return this.unitsService.listScoped(identity.organizationId, propertyId, filters);
  }

  @Post()
  @RequirePermissions("property.write")
  create(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("propertyId", new ParseUUIDPipe()) propertyId: string,
    @Body() dto: CreateUnitDto
  ): Promise<unknown> {
    return this.unitsService.createScoped({
      organizationId: identity.organizationId,
      propertyId,
      actorUserId: identity.userId,
      dto,
      requestId: req.requestId
    });
  }

  @Patch(":unitId")
  @RequirePermissions("property.write")
  update(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("propertyId", new ParseUUIDPipe()) propertyId: string,
    @Param("unitId", new ParseUUIDPipe()) unitId: string,
    @Body() dto: UpdateUnitDto
  ): Promise<unknown> {
    return this.unitsService.updateScoped({
      organizationId: identity.organizationId,
      propertyId,
      unitId,
      actorUserId: identity.userId,
      dto,
      requestId: req.requestId
    });
  }
}


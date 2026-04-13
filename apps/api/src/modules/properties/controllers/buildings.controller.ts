import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards
} from "@nestjs/common";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequestIdentity } from "../../../common/request-context/request-context.types";
import { CreateBuildingDto } from "../dto/create-building.dto";
import { UpdateBuildingDto } from "../dto/update-building.dto";
import { BuildingsService } from "../services/buildings.service";

@Controller("properties/:propertyId/buildings")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Get()
  @RequirePermissions("property.read")
  list(
    @CurrentUser() identity: RequestIdentity,
    @Param("propertyId", new ParseUUIDPipe()) propertyId: string
  ): Promise<unknown> {
    return this.buildingsService.listScoped(identity.organizationId, propertyId);
  }

  @Post()
  @RequirePermissions("property.write")
  create(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("propertyId", new ParseUUIDPipe()) propertyId: string,
    @Body() dto: CreateBuildingDto
  ): Promise<unknown> {
    return this.buildingsService.createScoped({
      organizationId: identity.organizationId,
      propertyId,
      actorUserId: identity.userId,
      dto,
      requestId: req.requestId
    });
  }

  @Patch(":buildingId")
  @RequirePermissions("property.write")
  update(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("propertyId", new ParseUUIDPipe()) propertyId: string,
    @Param("buildingId", new ParseUUIDPipe()) buildingId: string,
    @Body() dto: UpdateBuildingDto
  ): Promise<unknown> {
    return this.buildingsService.updateScoped({
      organizationId: identity.organizationId,
      propertyId,
      buildingId,
      actorUserId: identity.userId,
      dto,
      requestId: req.requestId
    });
  }
}


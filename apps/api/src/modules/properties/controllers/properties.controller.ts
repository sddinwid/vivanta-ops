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
import { CreatePropertyDto } from "../dto/create-property.dto";
import { PropertyFiltersDto } from "../dto/property-filters.dto";
import { UpdatePropertyDto } from "../dto/update-property.dto";
import { PropertiesService } from "../services/properties.service";

@Controller("properties")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @RequirePermissions("property.read")
  list(
    @CurrentUser() identity: RequestIdentity,
    @Query() filters: PropertyFiltersDto
  ): Promise<unknown> {
    return this.propertiesService.listScoped(identity.organizationId, filters);
  }

  @Post()
  @RequirePermissions("property.write")
  create(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Body() dto: CreatePropertyDto
  ): Promise<unknown> {
    return this.propertiesService.createScoped({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      dto,
      requestId: req.requestId
    });
  }

  @Get(":propertyId")
  @RequirePermissions("property.read")
  getById(
    @CurrentUser() identity: RequestIdentity,
    @Param("propertyId", new ParseUUIDPipe()) propertyId: string
  ): Promise<unknown> {
    return this.propertiesService.getByIdScoped(identity.organizationId, propertyId);
  }

  @Patch(":propertyId")
  @RequirePermissions("property.write")
  update(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("propertyId", new ParseUUIDPipe()) propertyId: string,
    @Body() dto: UpdatePropertyDto
  ): Promise<unknown> {
    return this.propertiesService.updateScoped({
      organizationId: identity.organizationId,
      propertyId,
      actorUserId: identity.userId,
      dto,
      requestId: req.requestId
    });
  }

  @Get(":propertyId/summary")
  @RequirePermissions("property.read")
  summary(
    @CurrentUser() identity: RequestIdentity,
    @Param("propertyId", new ParseUUIDPipe()) propertyId: string
  ): Promise<unknown> {
    return this.propertiesService.getSummaryScoped(
      identity.organizationId,
      propertyId
    );
  }
}


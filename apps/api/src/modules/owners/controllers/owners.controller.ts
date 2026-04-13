import {
  Body,
  Controller,
  Delete,
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
import { LinkOwnerToPropertyDto } from "../dto/link-owner-to-property.dto";
import { CreateOwnerDto } from "../dto/create-owner.dto";
import { OwnerFiltersDto } from "../dto/owner-filters.dto";
import { UpdateOwnerDto } from "../dto/update-owner.dto";
import { OwnersService } from "../services/owners.service";

@Controller("owners")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) {}

  @Get()
  @RequirePermissions("owner.read")
  list(
    @CurrentUser() identity: RequestIdentity,
    @Query() filters: OwnerFiltersDto
  ): Promise<unknown> {
    return this.ownersService.listScoped(identity.organizationId, filters);
  }

  @Post()
  @RequirePermissions("owner.write")
  create(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Body() dto: CreateOwnerDto
  ): Promise<unknown> {
    return this.ownersService.createScoped({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      dto,
      requestId: req.requestId
    });
  }

  @Get(":ownerId")
  @RequirePermissions("owner.read")
  getById(
    @CurrentUser() identity: RequestIdentity,
    @Param("ownerId", new ParseUUIDPipe()) ownerId: string
  ): Promise<unknown> {
    return this.ownersService.getByIdScoped(identity.organizationId, ownerId);
  }

  @Patch(":ownerId")
  @RequirePermissions("owner.write")
  update(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("ownerId", new ParseUUIDPipe()) ownerId: string,
    @Body() dto: UpdateOwnerDto
  ): Promise<unknown> {
    return this.ownersService.updateScoped({
      organizationId: identity.organizationId,
      ownerId,
      actorUserId: identity.userId,
      dto,
      requestId: req.requestId
    });
  }

  @Get(":ownerId/properties")
  @RequirePermissions("owner.read")
  listOwnerProperties(
    @CurrentUser() identity: RequestIdentity,
    @Param("ownerId", new ParseUUIDPipe()) ownerId: string
  ): Promise<unknown> {
    return this.ownersService.listOwnerPropertiesScoped(
      identity.organizationId,
      ownerId
    );
  }

  @Post(":ownerId/properties/:propertyId")
  @RequirePermissions("owner.write")
  linkOwnerToProperty(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("ownerId", new ParseUUIDPipe()) ownerId: string,
    @Param("propertyId", new ParseUUIDPipe()) propertyId: string,
    @Body() dto: LinkOwnerToPropertyDto
  ): Promise<unknown> {
    return this.ownersService.linkOwnerToPropertyScoped({
      organizationId: identity.organizationId,
      ownerId,
      propertyId,
      actorUserId: identity.userId,
      dto,
      requestId: req.requestId
    });
  }

  @Delete(":ownerId/properties/:propertyId")
  @RequirePermissions("owner.write")
  unlinkOwnerFromProperty(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("ownerId", new ParseUUIDPipe()) ownerId: string,
    @Param("propertyId", new ParseUUIDPipe()) propertyId: string
  ): Promise<unknown> {
    return this.ownersService.unlinkOwnerFromPropertyScoped({
      organizationId: identity.organizationId,
      ownerId,
      propertyId,
      actorUserId: identity.userId,
      requestId: req.requestId
    });
  }
}


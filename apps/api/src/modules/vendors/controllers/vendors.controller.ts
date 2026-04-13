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
import { CreateVendorDto } from "../dto/create-vendor.dto";
import { UpdateVendorDto } from "../dto/update-vendor.dto";
import { VendorFiltersDto } from "../dto/vendor-filters.dto";
import { VendorsService } from "../services/vendors.service";

@Controller("vendors")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  @RequirePermissions("vendor.read")
  list(
    @CurrentUser() identity: RequestIdentity,
    @Query() filters: VendorFiltersDto
  ): Promise<unknown> {
    return this.vendorsService.listScoped(identity.organizationId, filters);
  }

  @Post()
  @RequirePermissions("vendor.write")
  create(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Body() dto: CreateVendorDto
  ): Promise<unknown> {
    return this.vendorsService.createScoped({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      dto,
      requestId: req.requestId
    });
  }

  @Get(":vendorId")
  @RequirePermissions("vendor.read")
  getById(
    @CurrentUser() identity: RequestIdentity,
    @Param("vendorId", new ParseUUIDPipe()) vendorId: string
  ): Promise<unknown> {
    return this.vendorsService.getByIdScoped(identity.organizationId, vendorId);
  }

  @Patch(":vendorId")
  @RequirePermissions("vendor.write")
  update(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("vendorId", new ParseUUIDPipe()) vendorId: string,
    @Body() dto: UpdateVendorDto
  ): Promise<unknown> {
    return this.vendorsService.updateScoped({
      organizationId: identity.organizationId,
      vendorId,
      actorUserId: identity.userId,
      dto,
      requestId: req.requestId
    });
  }
}


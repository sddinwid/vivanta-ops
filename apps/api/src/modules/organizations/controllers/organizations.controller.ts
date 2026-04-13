import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequestIdentity } from "../../../common/request-context/request-context.types";
import { OrganizationsService } from "../services/organizations.service";

@Controller("organizations")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @RequirePermissions("organization.read")
  async list(@CurrentUser() identity: RequestIdentity): Promise<unknown> {
    const data = await this.organizationsService.listForScopedUser(
      identity.organizationId
    );
    return { data, meta: { total: data.length } };
  }

  @Get(":organizationId")
  @RequirePermissions("organization.read")
  getById(
    @CurrentUser() identity: RequestIdentity,
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string
  ): Promise<unknown> {
    return this.organizationsService.getByIdScoped(
      identity.organizationId,
      organizationId
    );
  }
}


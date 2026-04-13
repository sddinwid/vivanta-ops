import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequestIdentity } from "../../../common/request-context/request-context.types";
import { AuditService } from "../../audit/services/audit.service";
import { CreateRoleDto } from "../dto/create-role.dto";
import { AccessService } from "../services/access.service";

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AccessController {
  constructor(
    private readonly accessService: AccessService,
    private readonly auditService: AuditService
  ) {}

  @Get("roles")
  @RequirePermissions("role.read")
  async getRoles(@CurrentUser() identity: RequestIdentity): Promise<unknown> {
    const data = await this.accessService.getRoles(identity.organizationId);
    return { data, meta: { total: data.length } };
  }

  @Post("roles")
  @RequirePermissions("role.write")
  async createRole(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Body() dto: CreateRoleDto,
  ): Promise<unknown> {
    const role = await this.accessService.createRole(identity.organizationId, dto);
    await this.auditService.record({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      actionType: "role.create",
      entityType: "Role",
      entityId: role.id,
      newValues: { roleName: role.roleName, description: role.description },
      metadata: { requestId: req.requestId }
    });
    return role;
  }

  @Get("permissions")
  @RequirePermissions("role.read")
  async getPermissions(): Promise<unknown> {
    const data = await this.accessService.getPermissions();
    return { data, meta: { total: data.length } };
  }
}

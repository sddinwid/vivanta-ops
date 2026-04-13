import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequestIdentity } from "../../../common/request-context/request-context.types";
import { AuditFiltersDto } from "../dto/audit-filters.dto";
import { AuditService } from "../services/audit.service";

@Controller("audit")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get("events")
  @RequirePermissions("audit.read")
  listEvents(
    @CurrentUser() identity: RequestIdentity,
    @Query() filters: AuditFiltersDto
  ): Promise<unknown> {
    return this.auditService.list(identity.organizationId, filters);
  }
}


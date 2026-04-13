import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequestIdentity } from "../../../common/request-context/request-context.types";
import { AssignUserRolesDto } from "../dto/assign-user-roles.dto";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { UserFiltersDto } from "../dto/user-filters.dto";
import { UsersService } from "../services/users.service";

@Controller("users")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions("user.read")
  list(
    @CurrentUser() identity: RequestIdentity,
    @Query() filters: UserFiltersDto
  ): Promise<unknown> {
    return this.usersService.listScoped(identity.organizationId, filters);
  }

  @Get(":userId")
  @RequirePermissions("user.read")
  getById(
    @CurrentUser() identity: RequestIdentity,
    @Param("userId", new ParseUUIDPipe()) userId: string
  ): Promise<unknown> {
    return this.usersService.getByIdScoped(identity.organizationId, userId);
  }

  @Post()
  @RequirePermissions("user.write")
  create(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Body() dto: CreateUserDto
  ): Promise<unknown> {
    return this.usersService.createScoped({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      dto,
      requestId: req.requestId
    });
  }

  @Patch(":userId")
  @RequirePermissions("user.write")
  update(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("userId", new ParseUUIDPipe()) userId: string,
    @Body() dto: UpdateUserDto
  ): Promise<unknown> {
    return this.usersService.updateScoped({
      organizationId: identity.organizationId,
      userId,
      actorUserId: identity.userId,
      dto,
      requestId: req.requestId
    });
  }

  @Get(":userId/roles")
  @RequirePermissions("role.read")
  getUserRoles(
    @CurrentUser() identity: RequestIdentity,
    @Param("userId", new ParseUUIDPipe()) userId: string
  ): Promise<unknown> {
    return this.usersService.getUserRolesScoped(identity.organizationId, userId);
  }

  @Put(":userId/roles")
  @RequirePermissions("role.write")
  replaceUserRoles(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("userId", new ParseUUIDPipe()) userId: string,
    @Body() dto: AssignUserRolesDto
  ): Promise<unknown> {
    return this.usersService.replaceUserRolesScoped({
      organizationId: identity.organizationId,
      userId,
      actorUserId: identity.userId,
      dto,
      requestId: req.requestId
    });
  }
}


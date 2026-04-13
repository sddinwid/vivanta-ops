import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Prisma, UserStatus, UserType } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { AccessService } from "../../access/services/access.service";
import { AuditService } from "../../audit/services/audit.service";
import { AssignUserRolesDto } from "../dto/assign-user-roles.dto";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { UserFiltersDto } from "../dto/user-filters.dto";
import { UserMapper } from "../mappers/user.mapper";
import { UsersRepository } from "../repositories/users.repository";

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly accessService: AccessService,
    private readonly auditService: AuditService
  ) {}

  async listScoped(organizationId: string, filters: UserFiltersDto) {
    const [users, total] = await Promise.all([
      this.usersRepository.listByOrganization(organizationId, filters),
      this.usersRepository.countByOrganization(organizationId, filters)
    ]);
    return {
      data: users.map(UserMapper.toResponse),
      meta: {
        total,
        limit: filters.limit ?? 25,
        offset: filters.offset ?? 0
      }
    };
  }

  async getByIdScoped(organizationId: string, userId: string) {
    const user = await this.usersRepository.findByIdScoped(userId, organizationId);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return UserMapper.toResponse(user);
  }

  async createScoped(params: {
    organizationId: string;
    actorUserId: string;
    dto: CreateUserDto;
    requestId?: string;
  }) {
    const { organizationId, actorUserId, dto, requestId } = params;
    const passwordHash = await bcrypt.hash(dto.password ?? randomUUID(), 10);

    try {
      const user = await this.usersRepository.create({
        organization: { connect: { id: organizationId } },
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        userType: dto.userType ?? UserType.INTERNAL,
        status: dto.status ?? UserStatus.ACTIVE
      });

      await this.auditService.record({
        organizationId,
        actorUserId,
        actionType: "user.create",
        entityType: "User",
        entityId: user.id,
        newValues: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType,
          status: user.status
        },
        metadata: { requestId }
      });

      return UserMapper.toResponse(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new BadRequestException("User email already exists");
      }
      throw error;
    }
  }

  async updateScoped(params: {
    organizationId: string;
    userId: string;
    actorUserId: string;
    dto: UpdateUserDto;
    requestId?: string;
  }) {
    const { organizationId, userId, actorUserId, dto, requestId } = params;
    const existing = await this.usersRepository.findByIdScoped(userId, organizationId);
    if (!existing) {
      throw new NotFoundException("User not found");
    }

    const data: Prisma.UserUpdateInput = {
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      userType: dto.userType,
      status: dto.status
    };
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    try {
      const updated = await this.usersRepository.update(userId, data);
      await this.auditService.record({
        organizationId,
        actorUserId,
        actionType: "user.update",
        entityType: "User",
        entityId: updated.id,
        oldValues: UserMapper.toResponse(existing),
        newValues: UserMapper.toResponse(updated),
        metadata: { requestId }
      });
      return UserMapper.toResponse(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new BadRequestException("User email already exists");
      }
      throw error;
    }
  }

  async getUserRolesScoped(organizationId: string, userId: string) {
    const user = await this.usersRepository.findByIdScoped(userId, organizationId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const assignments = await this.usersRepository.getUserRoles(userId, organizationId);
    return assignments.map((assignment) => ({
      id: assignment.role.id,
      roleName: assignment.role.roleName,
      description: assignment.role.description,
      permissions: assignment.role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        permissionName: rp.permission.permissionName
      }))
    }));
  }

  async replaceUserRolesScoped(params: {
    organizationId: string;
    userId: string;
    actorUserId: string;
    dto: AssignUserRolesDto;
    requestId?: string;
  }) {
    const { organizationId, userId, actorUserId, dto, requestId } = params;
    const user = await this.usersRepository.findByIdScoped(userId, organizationId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    await this.accessService.validateRolesForOrganization(
      organizationId,
      dto.roleIds
    );
    await this.usersRepository.replaceRoles(userId, dto.roleIds);

    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "user.roles.replace",
      entityType: "User",
      entityId: userId,
      newValues: { roleIds: dto.roleIds },
      metadata: { requestId }
    });

    return this.getUserRolesScoped(organizationId, userId);
  }
}

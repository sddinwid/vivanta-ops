import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CreateRoleDto } from "../dto/create-role.dto";
import { AccessRepository } from "../repositories/access.repository";

@Injectable()
export class AccessService {
  constructor(private readonly accessRepository: AccessRepository) {}

  async getRoles(organizationId: string): Promise<
    {
      id: string;
      roleName: string;
      description: string | null;
      createdAt: Date;
      permissions: { id: string; permissionName: string }[];
    }[]
  > {
    const roles = await this.accessRepository.listRolesByOrganization(
      organizationId
    );
    return roles.map((role) => ({
      id: role.id,
      roleName: role.roleName,
      description: role.description,
      createdAt: role.createdAt,
      permissions: role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        permissionName: rp.permission.permissionName
      }))
    }));
  }

  getPermissions() {
    return this.accessRepository.listPermissions();
  }

  async createRole(
    organizationId: string,
    dto: CreateRoleDto
  ): Promise<{ id: string; roleName: string; description: string | null }> {
    if (dto.permissionIds && dto.permissionIds.length > 0) {
      const existingPermissions = await this.getPermissions();
      const existingIds = new Set(existingPermissions.map((p) => p.id));
      const missingPermission = dto.permissionIds.find((id) => !existingIds.has(id));
      if (missingPermission) {
        throw new BadRequestException(
          `Unknown permission id: ${missingPermission}`
        );
      }
    }

    try {
      const role = await this.accessRepository.createRole({
        organizationId,
        roleName: dto.roleName,
        description: dto.description,
        permissionIds: dto.permissionIds
      });
      return {
        id: role.id,
        roleName: role.roleName,
        description: role.description
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new BadRequestException("Role name already exists");
      }
      throw error;
    }
  }

  getEffectivePermissionsForUser(
    userId: string,
    organizationId: string
  ): Promise<string[]> {
    return this.accessRepository.listEffectivePermissionsByUser(
      organizationId,
      userId
    );
  }

  async validateRolesForOrganization(
    organizationId: string,
    roleIds: string[]
  ): Promise<void> {
    if (roleIds.length === 0) {
      return;
    }
    const existing = await this.accessRepository.listRoleIdsByOrganization(
      organizationId,
      roleIds
    );
    if (existing.length !== roleIds.length) {
      throw new NotFoundException(
        "One or more role IDs do not belong to this organization"
      );
    }
  }
}


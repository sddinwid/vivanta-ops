import { Injectable } from "@nestjs/common";
import { Permission, Prisma, Role } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";

export type RoleWithPermissions = Prisma.RoleGetPayload<{
  include: {
    rolePermissions: {
      include: {
        permission: true;
      };
    };
  };
}>;

@Injectable()
export class AccessRepository {
  constructor(private readonly prisma: PrismaService) {}

  findRoleById(roleId: string): Promise<Role | null> {
    return this.prisma.role.findUnique({ where: { id: roleId } });
  }

  listRolesByOrganization(organizationId: string): Promise<RoleWithPermissions[]> {
    return this.prisma.role.findMany({
      where: { organizationId },
      orderBy: { roleName: "asc" },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });
  }

  listPermissions(): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      orderBy: { permissionName: "asc" }
    });
  }

  async createRole(params: {
    organizationId: string;
    roleName: string;
    description?: string;
    permissionIds?: string[];
  }): Promise<Role> {
    const { organizationId, roleName, description, permissionIds } = params;
    return this.prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          organizationId,
          roleName,
          description
        }
      });

      if (permissionIds && permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId: role.id,
            permissionId
          })),
          skipDuplicates: true
        });
      }

      return role;
    });
  }

  listRoleIdsByOrganization(
    organizationId: string,
    roleIds: string[]
  ): Promise<Pick<Role, "id">[]> {
    return this.prisma.role.findMany({
      where: { organizationId, id: { in: roleIds } },
      select: { id: true }
    });
  }

  async listEffectivePermissionsByUser(
    organizationId: string,
    userId: string
  ): Promise<string[]> {
    const assignments = await this.prisma.userRoleAssignment.findMany({
      where: {
        userId,
        role: { organizationId }
      },
      select: {
        role: {
          select: {
            rolePermissions: {
              select: {
                permission: {
                  select: {
                    permissionName: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const names = new Set<string>();
    assignments.forEach((assignment) => {
      assignment.role.rolePermissions.forEach((rp) => {
        names.add(rp.permission.permissionName);
      });
    });
    return [...names];
  }
}

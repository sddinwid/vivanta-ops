import { Injectable } from "@nestjs/common";
import { Prisma, User } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";
import { UserFiltersDto } from "../dto/user-filters.dto";

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByOrganization(organizationId: string, filters: UserFiltersDto): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        organizationId,
        status: filters.status,
        userType: filters.userType,
        OR: filters.search
          ? [
              { email: { contains: filters.search, mode: "insensitive" } },
              { firstName: { contains: filters.search, mode: "insensitive" } },
              { lastName: { contains: filters.search, mode: "insensitive" } }
            ]
          : undefined
      },
      orderBy: [{ createdAt: "desc" }],
      skip: filters.offset,
      take: filters.limit
    });
  }

  countByOrganization(organizationId: string, filters: UserFiltersDto): Promise<number> {
    return this.prisma.user.count({
      where: {
        organizationId,
        status: filters.status,
        userType: filters.userType,
        OR: filters.search
          ? [
              { email: { contains: filters.search, mode: "insensitive" } },
              { firstName: { contains: filters.search, mode: "insensitive" } },
              { lastName: { contains: filters.search, mode: "insensitive" } }
            ]
          : undefined
      }
    });
  }

  findByIdScoped(userId: string, organizationId: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id: userId, organizationId }
    });
  }

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  update(
    userId: string,
    data: Prisma.UserUpdateInput
  ): Promise<User> {
    return this.prisma.user.update({
      where: {
        id: userId
      },
      data
    });
  }

  async replaceRoles(userId: string, roleIds: string[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.userRoleAssignment.deleteMany({
        where: { userId }
      });
      if (roleIds.length > 0) {
        await tx.userRoleAssignment.createMany({
          data: roleIds.map((roleId) => ({ userId, roleId })),
          skipDuplicates: true
        });
      }
    });
  }

  getUserRoles(userId: string, organizationId: string) {
    return this.prisma.userRoleAssignment.findMany({
      where: {
        userId,
        role: { organizationId }
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });
  }
}

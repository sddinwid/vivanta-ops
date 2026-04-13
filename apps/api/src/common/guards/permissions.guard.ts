import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  REQUIRED_PERMISSIONS_KEY,
} from "../decorators/require-permissions.decorator";
import { RequestWithContext } from "../request-context/request-context.types";
import { PrismaService } from "../../database/prisma/prisma.service";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const identity = request.user;
    if (!identity) {
      throw new ForbiddenException("Missing authenticated user context");
    }

    const assignments = await this.prisma.userRoleAssignment.findMany({
      where: {
        userId: identity.userId,
        role: { organizationId: identity.organizationId }
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

    const effectivePermissions = new Set<string>();
    assignments.forEach((assignment) => {
      assignment.role.rolePermissions.forEach((rp) => {
        effectivePermissions.add(rp.permission.permissionName);
      });
    });

    const hasAllPermissions = requiredPermissions.every((permission) =>
      effectivePermissions.has(permission)
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return true;
  }
}

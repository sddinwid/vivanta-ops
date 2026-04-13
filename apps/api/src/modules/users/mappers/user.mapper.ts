import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";

@Injectable()
export class UserMapper {
  static toResponse(user: User) {
    return {
      id: user.id,
      organizationId: user.organizationId,
      ownerId: user.ownerId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}

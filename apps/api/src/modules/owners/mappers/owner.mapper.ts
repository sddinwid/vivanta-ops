import { Injectable } from "@nestjs/common";
import { Owner } from "@prisma/client";

@Injectable()
export class OwnerMapper {
  static toResponse(owner: Owner) {
    return {
      id: owner.id,
      organizationId: owner.organizationId,
      displayName: owner.displayName,
      email: owner.email,
      phone: owner.phone,
      isCompany: owner.isCompany,
      status: owner.status,
      createdAt: owner.createdAt,
      updatedAt: owner.updatedAt
    };
  }
}


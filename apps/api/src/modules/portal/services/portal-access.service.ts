import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { UserType } from "@prisma/client";
import { RequestIdentity } from "../../../common/request-context/request-context.types";
import { PortalRepository } from "../repositories/portal.repository";

export interface PortalAccessContext {
  userId: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  ownerId: string;
  ownerDisplayName: string;
  ownerEmail: string | null;
  ownerPhone: string | null;
  ownerIsCompany: boolean;
  ownerStatus: string;
  organizationName: string;
  organizationSlug: string;
}

@Injectable()
export class PortalAccessService {
  constructor(private readonly portalRepository: PortalRepository) {}

  async requirePortalContext(identity: RequestIdentity): Promise<PortalAccessContext> {
    const user = await this.portalRepository.getPortalUserContext(
      identity.userId,
      identity.organizationId
    );

    if (!user) {
      throw new NotFoundException("Portal user context not found");
    }

    if (user.userType !== UserType.OWNER) {
      throw new ForbiddenException("Portal access is limited to owner users");
    }

    if (!user.ownerId || !user.owner) {
      throw new ForbiddenException("Owner user is not linked to an owner profile");
    }

    if (user.owner.organizationId !== user.organizationId) {
      throw new ForbiddenException("Owner profile organization mismatch");
    }

    return {
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      ownerId: user.owner.id,
      ownerDisplayName: user.owner.displayName,
      ownerEmail: user.owner.email,
      ownerPhone: user.owner.phone,
      ownerIsCompany: user.owner.isCompany,
      ownerStatus: user.owner.status,
      organizationName: user.organization.name,
      organizationSlug: user.organization.slug
    };
  }

  async assertPropertyAccess(organizationId: string, ownerId: string, propertyId: string): Promise<void> {
    const property = await this.portalRepository.findOwnerPropertyById(
      ownerId,
      organizationId,
      propertyId
    );

    if (!property) {
      throw new NotFoundException("Property not found for owner context");
    }
  }

  listAccessiblePropertyIds(organizationId: string, ownerId: string): Promise<string[]> {
    return this.portalRepository.listOwnerPropertyIds(ownerId, organizationId);
  }
}

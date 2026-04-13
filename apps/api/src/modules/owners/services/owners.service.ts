import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { Prisma, UserStatus } from "@prisma/client";
import { AuditService } from "../../audit/services/audit.service";
import { LinkOwnerToPropertyDto } from "../dto/link-owner-to-property.dto";
import { CreateOwnerDto } from "../dto/create-owner.dto";
import { OwnerFiltersDto } from "../dto/owner-filters.dto";
import { UpdateOwnerDto } from "../dto/update-owner.dto";
import { OwnerMapper } from "../mappers/owner.mapper";
import { OwnersRepository } from "../repositories/owners.repository";
import { PropertyOwnerLinksRepository } from "../repositories/property-owner-links.repository";

@Injectable()
export class OwnersService {
  constructor(
    private readonly ownersRepository: OwnersRepository,
    private readonly propertyOwnerLinksRepository: PropertyOwnerLinksRepository,
    private readonly auditService: AuditService
  ) {}

  async listScoped(organizationId: string, filters: OwnerFiltersDto) {
    const [owners, total] = await Promise.all([
      this.ownersRepository.listByOrganization(organizationId, filters),
      this.ownersRepository.countByOrganization(organizationId, filters)
    ]);
    return {
      data: owners.map(OwnerMapper.toResponse),
      meta: {
        total,
        limit: filters.limit ?? 25,
        offset: filters.offset ?? 0
      }
    };
  }

  async getByIdScoped(organizationId: string, ownerId: string) {
    const owner = await this.ownersRepository.findByIdScoped(ownerId, organizationId);
    if (!owner) {
      throw new NotFoundException("Owner not found");
    }
    return OwnerMapper.toResponse(owner);
  }

  async createScoped(params: {
    organizationId: string;
    actorUserId: string;
    dto: CreateOwnerDto;
    requestId?: string;
  }) {
    const { organizationId, actorUserId, dto, requestId } = params;
    try {
      const owner = await this.ownersRepository.create({
        organization: { connect: { id: organizationId } },
        displayName: dto.displayName,
        email: dto.email,
        phone: dto.phone,
        isCompany: dto.isCompany ?? false,
        status: dto.status ?? UserStatus.ACTIVE
      });
      await this.auditService.record({
        organizationId,
        actorUserId,
        actionType: "owner.create",
        entityType: "Owner",
        entityId: owner.id,
        newValues: OwnerMapper.toResponse(owner),
        metadata: { requestId }
      });
      return OwnerMapper.toResponse(owner);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new BadRequestException("Owner email already exists");
      }
      throw error;
    }
  }

  async updateScoped(params: {
    organizationId: string;
    ownerId: string;
    actorUserId: string;
    dto: UpdateOwnerDto;
    requestId?: string;
  }) {
    const { organizationId, ownerId, actorUserId, dto, requestId } = params;
    const existing = await this.ownersRepository.findByIdScoped(ownerId, organizationId);
    if (!existing) {
      throw new NotFoundException("Owner not found");
    }

    const data: Prisma.OwnerUpdateInput = {
      displayName: dto.displayName,
      email: dto.email,
      phone: dto.phone,
      isCompany: dto.isCompany,
      status: dto.status
    };

    try {
      const updated = await this.ownersRepository.update(ownerId, data);
      await this.auditService.record({
        organizationId,
        actorUserId,
        actionType: "owner.update",
        entityType: "Owner",
        entityId: updated.id,
        oldValues: OwnerMapper.toResponse(existing),
        newValues: OwnerMapper.toResponse(updated),
        metadata: { requestId }
      });
      return OwnerMapper.toResponse(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new BadRequestException("Owner email already exists");
      }
      throw error;
    }
  }

  async listOwnerPropertiesScoped(organizationId: string, ownerId: string) {
    await this.requireOwner(ownerId, organizationId);
    const links = await this.propertyOwnerLinksRepository.listOwnerProperties(
      ownerId,
      organizationId
    );
    const data = links.map((link) => ({
      property: {
        id: link.property.id,
        propertyCode: link.property.propertyCode,
        name: link.property.name,
        status: link.property.status,
        propertyType: link.property.propertyType
      },
      ownership: {
        ownershipPercentage: link.ownershipPercentage,
        startDate: link.startDate,
        endDate: link.endDate,
        isPrimaryContact: link.isPrimaryContact,
        createdAt: link.createdAt
      }
    }));
    return { data, meta: { total: data.length } };
  }

  async linkOwnerToPropertyScoped(params: {
    organizationId: string;
    ownerId: string;
    propertyId: string;
    actorUserId: string;
    dto: LinkOwnerToPropertyDto;
    requestId?: string;
  }) {
    const { organizationId, ownerId, propertyId, actorUserId, dto, requestId } =
      params;
    await this.requireOwner(ownerId, organizationId);
    const property = await this.ownersRepository.findPropertyInOrganization(
      propertyId,
      organizationId
    );
    if (!property) {
      throw new NotFoundException("Property not found in this organization");
    }

    const existing = await this.propertyOwnerLinksRepository.findLink(
      propertyId,
      ownerId
    );
    if (existing) {
      throw new BadRequestException("Owner is already linked to this property");
    }

    const link = await this.propertyOwnerLinksRepository.create({
      propertyId,
      ownerId,
      ownershipPercentage: dto.ownershipPercentage,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      isPrimaryContact: dto.isPrimaryContact ?? false
    });

    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "owner.link_property",
      entityType: "PropertyOwnerLink",
      entityId: `${propertyId}:${ownerId}`,
      newValues: link,
      metadata: { requestId, ownerId, propertyId }
    });

    return link;
  }

  async unlinkOwnerFromPropertyScoped(params: {
    organizationId: string;
    ownerId: string;
    propertyId: string;
    actorUserId: string;
    requestId?: string;
  }) {
    const { organizationId, ownerId, propertyId, actorUserId, requestId } = params;
    await this.requireOwner(ownerId, organizationId);
    const property = await this.ownersRepository.findPropertyInOrganization(
      propertyId,
      organizationId
    );
    if (!property) {
      throw new NotFoundException("Property not found in this organization");
    }

    const link = await this.propertyOwnerLinksRepository.findLink(propertyId, ownerId);
    if (!link) {
      throw new NotFoundException("Owner-property link not found");
    }
    await this.propertyOwnerLinksRepository.delete(propertyId, ownerId);
    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "owner.unlink_property",
      entityType: "PropertyOwnerLink",
      entityId: `${propertyId}:${ownerId}`,
      oldValues: link,
      metadata: { requestId, ownerId, propertyId }
    });

    return {
      ownerId,
      propertyId,
      removed: true
    };
  }

  private async requireOwner(ownerId: string, organizationId: string): Promise<void> {
    const owner = await this.ownersRepository.findByIdScoped(ownerId, organizationId);
    if (!owner) {
      throw new NotFoundException("Owner not found");
    }
  }
}


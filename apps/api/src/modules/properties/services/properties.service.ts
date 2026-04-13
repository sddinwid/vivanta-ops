import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { Prisma, PropertyStatus } from "@prisma/client";
import { AuditService } from "../../audit/services/audit.service";
import { CreatePropertyDto } from "../dto/create-property.dto";
import { PropertyFiltersDto } from "../dto/property-filters.dto";
import { UpdatePropertyDto } from "../dto/update-property.dto";
import { PropertyMapper } from "../mappers/property.mapper";
import { PropertiesRepository } from "../repositories/properties.repository";

@Injectable()
export class PropertiesService {
  constructor(
    private readonly propertiesRepository: PropertiesRepository,
    private readonly auditService: AuditService
  ) {}

  async listScoped(organizationId: string, filters: PropertyFiltersDto) {
    const [properties, total] = await Promise.all([
      this.propertiesRepository.listByOrganization(organizationId, filters),
      this.propertiesRepository.countByOrganization(organizationId, filters)
    ]);
    return {
      data: properties.map(PropertyMapper.toResponse),
      meta: {
        total,
        limit: filters.limit ?? 25,
        offset: filters.offset ?? 0
      }
    };
  }

  async getByIdScoped(organizationId: string, propertyId: string) {
    const property = await this.propertiesRepository.findByIdScoped(
      propertyId,
      organizationId
    );
    if (!property) {
      throw new NotFoundException("Property not found");
    }
    return PropertyMapper.toResponse(property);
  }

  async createScoped(params: {
    organizationId: string;
    actorUserId: string;
    dto: CreatePropertyDto;
    requestId?: string;
  }) {
    const { organizationId, actorUserId, dto, requestId } = params;
    await this.validateManager(dto.managerUserId, organizationId);

    try {
      const property = await this.propertiesRepository.create({
        organization: { connect: { id: organizationId } },
        propertyCode: dto.propertyCode,
        name: dto.name,
        street: dto.street,
        city: dto.city,
        postalCode: dto.postalCode,
        countryCode: dto.countryCode,
        status: dto.status ?? PropertyStatus.ACTIVE,
        propertyType: dto.propertyType,
        managerUser: dto.managerUserId
          ? { connect: { id: dto.managerUserId } }
          : undefined
      });

      await this.auditService.record({
        organizationId,
        actorUserId,
        actionType: "property.create",
        entityType: "Property",
        entityId: property.id,
        newValues: PropertyMapper.toResponse(property),
        metadata: { requestId }
      });
      return PropertyMapper.toResponse(property);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new BadRequestException(
          "Property code already exists for this organization"
        );
      }
      throw error;
    }
  }

  async updateScoped(params: {
    organizationId: string;
    propertyId: string;
    actorUserId: string;
    dto: UpdatePropertyDto;
    requestId?: string;
  }) {
    const { organizationId, propertyId, actorUserId, dto, requestId } = params;
    const existing = await this.propertiesRepository.findByIdScoped(
      propertyId,
      organizationId
    );
    if (!existing) {
      throw new NotFoundException("Property not found");
    }
    await this.validateManager(dto.managerUserId, organizationId);

    const data: Prisma.PropertyUpdateInput = {
      propertyCode: dto.propertyCode,
      name: dto.name,
      street: dto.street,
      city: dto.city,
      postalCode: dto.postalCode,
      countryCode: dto.countryCode,
      status: dto.status,
      propertyType: dto.propertyType,
      managerUser:
        dto.managerUserId === null
          ? { disconnect: true }
          : dto.managerUserId
            ? { connect: { id: dto.managerUserId } }
            : undefined
    };

    try {
      const updated = await this.propertiesRepository.update(propertyId, data);
      await this.auditService.record({
        organizationId,
        actorUserId,
        actionType: "property.update",
        entityType: "Property",
        entityId: updated.id,
        oldValues: PropertyMapper.toResponse(existing),
        newValues: PropertyMapper.toResponse(updated),
        metadata: { requestId }
      });
      return PropertyMapper.toResponse(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new BadRequestException(
          "Property code already exists for this organization"
        );
      }
      throw error;
    }
  }

  async getSummaryScoped(organizationId: string, propertyId: string) {
    const property = await this.propertiesRepository.findByIdScoped(
      propertyId,
      organizationId
    );
    if (!property) {
      throw new NotFoundException("Property not found");
    }
    const counts = await this.propertiesRepository.getSummary(property.id);
    return {
      property: PropertyMapper.toResponse(property),
      counts
    };
  }

  private async validateManager(
    managerUserId: string | null | undefined,
    organizationId: string
  ): Promise<void> {
    if (!managerUserId) {
      return;
    }
    const manager = await this.propertiesRepository.findManagerInOrganization(
      managerUserId,
      organizationId
    );
    if (!manager) {
      throw new BadRequestException(
        "managerUserId must belong to the same organization"
      );
    }
  }
}


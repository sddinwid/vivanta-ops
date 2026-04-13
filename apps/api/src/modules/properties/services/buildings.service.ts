import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../../audit/services/audit.service";
import { CreateBuildingDto } from "../dto/create-building.dto";
import { UpdateBuildingDto } from "../dto/update-building.dto";
import { BuildingMapper } from "../mappers/building.mapper";
import { BuildingsRepository } from "../repositories/buildings.repository";
import { PropertiesRepository } from "../repositories/properties.repository";

@Injectable()
export class BuildingsService {
  constructor(
    private readonly buildingsRepository: BuildingsRepository,
    private readonly propertiesRepository: PropertiesRepository,
    private readonly auditService: AuditService
  ) {}

  async listScoped(organizationId: string, propertyId: string) {
    await this.requireProperty(propertyId, organizationId);
    const buildings = await this.buildingsRepository.listByProperty(propertyId);
    return {
      data: buildings.map(BuildingMapper.toResponse),
      meta: { total: buildings.length }
    };
  }

  async createScoped(params: {
    organizationId: string;
    propertyId: string;
    actorUserId: string;
    dto: CreateBuildingDto;
    requestId?: string;
  }) {
    const { organizationId, propertyId, actorUserId, dto, requestId } = params;
    await this.requireProperty(propertyId, organizationId);
    try {
      const building = await this.buildingsRepository.create({
        property: { connect: { id: propertyId } },
        name: dto.name,
        buildingCode: dto.buildingCode
      });
      await this.auditService.record({
        organizationId,
        actorUserId,
        actionType: "building.create",
        entityType: "Building",
        entityId: building.id,
        newValues: BuildingMapper.toResponse(building),
        metadata: { requestId, propertyId }
      });
      return BuildingMapper.toResponse(building);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new BadRequestException(
          "Building code already exists for this property"
        );
      }
      throw error;
    }
  }

  async updateScoped(params: {
    organizationId: string;
    propertyId: string;
    buildingId: string;
    actorUserId: string;
    dto: UpdateBuildingDto;
    requestId?: string;
  }) {
    const { organizationId, propertyId, buildingId, actorUserId, dto, requestId } =
      params;
    await this.requireProperty(propertyId, organizationId);
    const existing = await this.buildingsRepository.findByIdInProperty(
      buildingId,
      propertyId
    );
    if (!existing) {
      throw new NotFoundException("Building not found");
    }

    const data: Prisma.BuildingUpdateInput = {
      name: dto.name,
      buildingCode: dto.buildingCode
    };

    try {
      const updated = await this.buildingsRepository.update(buildingId, data);
      await this.auditService.record({
        organizationId,
        actorUserId,
        actionType: "building.update",
        entityType: "Building",
        entityId: updated.id,
        oldValues: BuildingMapper.toResponse(existing),
        newValues: BuildingMapper.toResponse(updated),
        metadata: { requestId, propertyId }
      });
      return BuildingMapper.toResponse(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new BadRequestException(
          "Building code already exists for this property"
        );
      }
      throw error;
    }
  }

  private async requireProperty(
    propertyId: string,
    organizationId: string
  ): Promise<void> {
    const property = await this.propertiesRepository.findByIdScoped(
      propertyId,
      organizationId
    );
    if (!property) {
      throw new NotFoundException("Property not found");
    }
  }
}


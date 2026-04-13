import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { OccupancyStatus, Prisma } from "@prisma/client";
import { AuditService } from "../../audit/services/audit.service";
import { CreateUnitDto } from "../dto/create-unit.dto";
import { UnitFiltersDto } from "../dto/unit-filters.dto";
import { UpdateUnitDto } from "../dto/update-unit.dto";
import { UnitMapper } from "../mappers/unit.mapper";
import { PropertiesRepository } from "../repositories/properties.repository";
import { UnitsRepository } from "../repositories/units.repository";

@Injectable()
export class UnitsService {
  constructor(
    private readonly unitsRepository: UnitsRepository,
    private readonly propertiesRepository: PropertiesRepository,
    private readonly auditService: AuditService
  ) {}

  async listScoped(
    organizationId: string,
    propertyId: string,
    filters: UnitFiltersDto
  ) {
    await this.requireProperty(propertyId, organizationId);
    if (filters.buildingId) {
      await this.validateBuilding(propertyId, filters.buildingId);
    }

    const [units, total] = await Promise.all([
      this.unitsRepository.listByProperty(propertyId, filters),
      this.unitsRepository.countByProperty(propertyId, filters)
    ]);

    return {
      data: units.map(UnitMapper.toResponse),
      meta: {
        total,
        limit: filters.limit ?? 50,
        offset: filters.offset ?? 0
      }
    };
  }

  async createScoped(params: {
    organizationId: string;
    propertyId: string;
    actorUserId: string;
    dto: CreateUnitDto;
    requestId?: string;
  }) {
    const { organizationId, propertyId, actorUserId, dto, requestId } = params;
    await this.requireProperty(propertyId, organizationId);
    await this.validateBuilding(propertyId, dto.buildingId);

    try {
      const unit = await this.unitsRepository.create({
        property: { connect: { id: propertyId } },
        building: dto.buildingId
          ? { connect: { id: dto.buildingId } }
          : undefined,
        unitNumber: dto.unitNumber,
        floorLabel: dto.floorLabel,
        unitType: dto.unitType,
        squareMeters: dto.squareMeters,
        bedroomCount: dto.bedroomCount,
        bathroomCount: dto.bathroomCount,
        occupancyStatus: dto.occupancyStatus ?? OccupancyStatus.VACANT
      });
      await this.auditService.record({
        organizationId,
        actorUserId,
        actionType: "unit.create",
        entityType: "Unit",
        entityId: unit.id,
        newValues: UnitMapper.toResponse(unit),
        metadata: { requestId, propertyId }
      });
      return UnitMapper.toResponse(unit);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new BadRequestException(
          "Unit number already exists for this property"
        );
      }
      throw error;
    }
  }

  async updateScoped(params: {
    organizationId: string;
    propertyId: string;
    unitId: string;
    actorUserId: string;
    dto: UpdateUnitDto;
    requestId?: string;
  }) {
    const { organizationId, propertyId, unitId, actorUserId, dto, requestId } =
      params;
    await this.requireProperty(propertyId, organizationId);
    await this.validateBuilding(propertyId, dto.buildingId);

    const existing = await this.unitsRepository.findByIdInProperty(unitId, propertyId);
    if (!existing) {
      throw new NotFoundException("Unit not found");
    }

    const data: Prisma.UnitUpdateInput = {
      unitNumber: dto.unitNumber,
      floorLabel: dto.floorLabel,
      unitType: dto.unitType,
      squareMeters: dto.squareMeters,
      bedroomCount: dto.bedroomCount,
      bathroomCount: dto.bathroomCount,
      occupancyStatus: dto.occupancyStatus,
      building:
        dto.buildingId === null
          ? { disconnect: true }
          : dto.buildingId
            ? { connect: { id: dto.buildingId } }
            : undefined
    };

    try {
      const updated = await this.unitsRepository.update(unitId, data);
      await this.auditService.record({
        organizationId,
        actorUserId,
        actionType: "unit.update",
        entityType: "Unit",
        entityId: updated.id,
        oldValues: UnitMapper.toResponse(existing),
        newValues: UnitMapper.toResponse(updated),
        metadata: { requestId, propertyId }
      });
      return UnitMapper.toResponse(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new BadRequestException(
          "Unit number already exists for this property"
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

  private async validateBuilding(
    propertyId: string,
    buildingId?: string | null
  ): Promise<void> {
    if (!buildingId) {
      return;
    }
    const building = await this.unitsRepository.findBuildingInProperty(
      buildingId,
      propertyId
    );
    if (!building) {
      throw new BadRequestException(
        "buildingId must belong to the same property"
      );
    }
  }
}


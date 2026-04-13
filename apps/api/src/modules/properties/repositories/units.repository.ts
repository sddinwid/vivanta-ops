import { Injectable } from "@nestjs/common";
import { Building, Prisma, Unit } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";
import { UnitFiltersDto } from "../dto/unit-filters.dto";

@Injectable()
export class UnitsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByProperty(propertyId: string, filters: UnitFiltersDto): Promise<Unit[]> {
    return this.prisma.unit.findMany({
      where: {
        propertyId,
        occupancyStatus: filters.occupancyStatus,
        buildingId: filters.buildingId,
        OR: filters.search
          ? [
              { unitNumber: { contains: filters.search, mode: "insensitive" } },
              { floorLabel: { contains: filters.search, mode: "insensitive" } }
            ]
          : undefined
      },
      orderBy: [{ createdAt: "asc" }],
      skip: filters.offset,
      take: filters.limit
    });
  }

  countByProperty(propertyId: string, filters: UnitFiltersDto): Promise<number> {
    return this.prisma.unit.count({
      where: {
        propertyId,
        occupancyStatus: filters.occupancyStatus,
        buildingId: filters.buildingId,
        OR: filters.search
          ? [
              { unitNumber: { contains: filters.search, mode: "insensitive" } },
              { floorLabel: { contains: filters.search, mode: "insensitive" } }
            ]
          : undefined
      }
    });
  }

  findByIdInProperty(unitId: string, propertyId: string): Promise<Unit | null> {
    return this.prisma.unit.findFirst({
      where: { id: unitId, propertyId }
    });
  }

  create(data: Prisma.UnitCreateInput): Promise<Unit> {
    return this.prisma.unit.create({ data });
  }

  update(unitId: string, data: Prisma.UnitUpdateInput): Promise<Unit> {
    return this.prisma.unit.update({
      where: { id: unitId },
      data
    });
  }

  findBuildingInProperty(
    buildingId: string,
    propertyId: string
  ): Promise<Pick<Building, "id"> | null> {
    return this.prisma.building.findFirst({
      where: { id: buildingId, propertyId },
      select: { id: true }
    });
  }
}


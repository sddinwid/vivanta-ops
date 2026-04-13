import { Injectable } from "@nestjs/common";
import { Building, Prisma } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";

@Injectable()
export class BuildingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByProperty(propertyId: string): Promise<Building[]> {
    return this.prisma.building.findMany({
      where: { propertyId },
      orderBy: [{ createdAt: "asc" }]
    });
  }

  findByIdInProperty(
    buildingId: string,
    propertyId: string
  ): Promise<Building | null> {
    return this.prisma.building.findFirst({
      where: { id: buildingId, propertyId }
    });
  }

  create(data: Prisma.BuildingCreateInput): Promise<Building> {
    return this.prisma.building.create({ data });
  }

  update(buildingId: string, data: Prisma.BuildingUpdateInput): Promise<Building> {
    return this.prisma.building.update({
      where: { id: buildingId },
      data
    });
  }
}


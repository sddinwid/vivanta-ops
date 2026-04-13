import { Injectable } from "@nestjs/common";
import { Prisma, Property, User } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";
import { PropertyFiltersDto } from "../dto/property-filters.dto";

@Injectable()
export class PropertiesRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByOrganization(
    organizationId: string,
    filters: PropertyFiltersDto
  ): Promise<Property[]> {
    return this.prisma.property.findMany({
      where: {
        organizationId,
        status: filters.status,
        propertyType: filters.propertyType,
        OR: filters.search
          ? [
              { name: { contains: filters.search, mode: "insensitive" } },
              { propertyCode: { contains: filters.search, mode: "insensitive" } },
              { city: { contains: filters.search, mode: "insensitive" } }
            ]
          : undefined
      },
      orderBy: [{ createdAt: "desc" }],
      skip: filters.offset,
      take: filters.limit
    });
  }

  countByOrganization(
    organizationId: string,
    filters: PropertyFiltersDto
  ): Promise<number> {
    return this.prisma.property.count({
      where: {
        organizationId,
        status: filters.status,
        propertyType: filters.propertyType,
        OR: filters.search
          ? [
              { name: { contains: filters.search, mode: "insensitive" } },
              { propertyCode: { contains: filters.search, mode: "insensitive" } },
              { city: { contains: filters.search, mode: "insensitive" } }
            ]
          : undefined
      }
    });
  }

  findByIdScoped(propertyId: string, organizationId: string): Promise<Property | null> {
    return this.prisma.property.findFirst({
      where: { id: propertyId, organizationId }
    });
  }

  create(data: Prisma.PropertyCreateInput): Promise<Property> {
    return this.prisma.property.create({ data });
  }

  update(propertyId: string, data: Prisma.PropertyUpdateInput): Promise<Property> {
    return this.prisma.property.update({
      where: { id: propertyId },
      data
    });
  }

  findManagerInOrganization(
    managerUserId: string,
    organizationId: string
  ): Promise<Pick<User, "id"> | null> {
    return this.prisma.user.findFirst({
      where: { id: managerUserId, organizationId },
      select: { id: true }
    });
  }

  async getSummary(propertyId: string): Promise<{
    buildingCount: number;
    unitCount: number;
  }> {
    const [buildingCount, unitCount] = await this.prisma.$transaction([
      this.prisma.building.count({ where: { propertyId } }),
      this.prisma.unit.count({ where: { propertyId } })
    ]);
    return { buildingCount, unitCount };
  }
}


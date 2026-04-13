import { Injectable } from "@nestjs/common";
import { Owner, Prisma, Property } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";
import { OwnerFiltersDto } from "../dto/owner-filters.dto";

@Injectable()
export class OwnersRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByOrganization(
    organizationId: string,
    filters: OwnerFiltersDto
  ): Promise<Owner[]> {
    return this.prisma.owner.findMany({
      where: {
        organizationId,
        status: filters.status,
        OR: filters.search
          ? [
              { displayName: { contains: filters.search, mode: "insensitive" } },
              { email: { contains: filters.search, mode: "insensitive" } }
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
    filters: OwnerFiltersDto
  ): Promise<number> {
    return this.prisma.owner.count({
      where: {
        organizationId,
        status: filters.status,
        OR: filters.search
          ? [
              { displayName: { contains: filters.search, mode: "insensitive" } },
              { email: { contains: filters.search, mode: "insensitive" } }
            ]
          : undefined
      }
    });
  }

  findByIdScoped(ownerId: string, organizationId: string): Promise<Owner | null> {
    return this.prisma.owner.findFirst({
      where: { id: ownerId, organizationId }
    });
  }

  create(data: Prisma.OwnerCreateInput): Promise<Owner> {
    return this.prisma.owner.create({ data });
  }

  update(ownerId: string, data: Prisma.OwnerUpdateInput): Promise<Owner> {
    return this.prisma.owner.update({
      where: { id: ownerId },
      data
    });
  }

  findPropertyInOrganization(
    propertyId: string,
    organizationId: string
  ): Promise<Pick<Property, "id"> | null> {
    return this.prisma.property.findFirst({
      where: { id: propertyId, organizationId },
      select: { id: true }
    });
  }
}


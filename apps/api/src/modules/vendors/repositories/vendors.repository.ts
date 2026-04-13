import { Injectable } from "@nestjs/common";
import { Prisma, Vendor } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";
import { VendorFiltersDto } from "../dto/vendor-filters.dto";

@Injectable()
export class VendorsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByOrganization(
    organizationId: string,
    filters: VendorFiltersDto
  ): Promise<Vendor[]> {
    return this.prisma.vendor.findMany({
      where: {
        organizationId,
        status: filters.status,
        tradeCategory: filters.tradeCategory,
        serviceRegions: filters.region
          ? { has: filters.region }
          : undefined,
        OR: filters.search
          ? [
              { name: { contains: filters.search, mode: "insensitive" } },
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
    filters: VendorFiltersDto
  ): Promise<number> {
    return this.prisma.vendor.count({
      where: {
        organizationId,
        status: filters.status,
        tradeCategory: filters.tradeCategory,
        serviceRegions: filters.region
          ? { has: filters.region }
          : undefined,
        OR: filters.search
          ? [
              { name: { contains: filters.search, mode: "insensitive" } },
              { email: { contains: filters.search, mode: "insensitive" } }
            ]
          : undefined
      }
    });
  }

  findByIdScoped(vendorId: string, organizationId: string): Promise<Vendor | null> {
    return this.prisma.vendor.findFirst({
      where: { id: vendorId, organizationId }
    });
  }

  create(data: Prisma.VendorCreateInput): Promise<Vendor> {
    return this.prisma.vendor.create({ data });
  }

  update(vendorId: string, data: Prisma.VendorUpdateInput): Promise<Vendor> {
    return this.prisma.vendor.update({
      where: { id: vendorId },
      data
    });
  }
}


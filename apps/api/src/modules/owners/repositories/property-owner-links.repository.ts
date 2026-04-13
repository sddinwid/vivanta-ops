import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma/prisma.service";

@Injectable()
export class PropertyOwnerLinksRepository {
  constructor(private readonly prisma: PrismaService) {}

  findLink(propertyId: string, ownerId: string) {
    return this.prisma.propertyOwnerLink.findUnique({
      where: {
        propertyId_ownerId: {
          propertyId,
          ownerId
        }
      }
    });
  }

  create(data: {
    propertyId: string;
    ownerId: string;
    ownershipPercentage?: number;
    startDate?: Date;
    endDate?: Date;
    isPrimaryContact: boolean;
  }) {
    return this.prisma.propertyOwnerLink.create({ data });
  }

  delete(propertyId: string, ownerId: string) {
    return this.prisma.propertyOwnerLink.delete({
      where: {
        propertyId_ownerId: {
          propertyId,
          ownerId
        }
      }
    });
  }

  listOwnerProperties(ownerId: string, organizationId: string) {
    return this.prisma.propertyOwnerLink.findMany({
      where: {
        ownerId,
        property: { organizationId }
      },
      include: {
        property: true
      },
      orderBy: { createdAt: "desc" }
    });
  }
}


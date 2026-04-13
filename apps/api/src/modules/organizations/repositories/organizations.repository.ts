import { Injectable } from "@nestjs/common";
import { Organization } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";

@Injectable()
export class OrganizationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByIds(organizationIds: string[]): Promise<Organization[]> {
    return this.prisma.organization.findMany({
      where: {
        id: { in: organizationIds }
      },
      orderBy: {
        name: "asc"
      }
    });
  }

  findById(organizationId: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({
      where: { id: organizationId }
    });
  }
}


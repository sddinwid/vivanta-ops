import { Injectable } from "@nestjs/common";
import { AiProviderConfig, AiCapability, Prisma } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";

@Injectable()
export class AiProviderConfigsRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(organizationId: string) {
    return this.prisma.aiProviderConfig.findMany({
      where: {
        OR: [{ organizationId }, { organizationId: null }]
      },
      orderBy: [{ organizationId: "desc" }, { updatedAt: "desc" }]
    });
  }

  create(data: Prisma.AiProviderConfigCreateInput): Promise<AiProviderConfig> {
    return this.prisma.aiProviderConfig.create({ data });
  }

  findById(configId: string): Promise<AiProviderConfig | null> {
    return this.prisma.aiProviderConfig.findUnique({ where: { id: configId } });
  }

  update(configId: string, data: Prisma.AiProviderConfigUpdateInput): Promise<AiProviderConfig> {
    return this.prisma.aiProviderConfig.update({
      where: { id: configId },
      data
    });
  }

  findPreferredConfig(
    organizationId: string,
    capability: AiCapability
  ): Promise<AiProviderConfig | null> {
    return this.prisma.aiProviderConfig.findFirst({
      where: {
        capability,
        isEnabled: true,
        OR: [{ organizationId }, { organizationId: null }]
      },
      orderBy: [{ organizationId: "desc" }, { updatedAt: "desc" }]
    });
  }

  findEffectiveConfig(
    organizationId: string,
    capability: AiCapability
  ): Promise<AiProviderConfig | null> {
    return this.prisma.aiProviderConfig.findFirst({
      where: {
        capability,
        OR: [{ organizationId }, { organizationId: null }]
      },
      orderBy: [{ organizationId: "desc" }, { updatedAt: "desc" }]
    });
  }
}

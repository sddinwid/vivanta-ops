import { Injectable } from "@nestjs/common";
import { AuditEvent, Prisma } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";
import { AuditFiltersDto } from "../dto/audit-filters.dto";

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.AuditEventCreateInput): Promise<AuditEvent> {
    return this.prisma.auditEvent.create({ data });
  }

  list(
    organizationId: string,
    filters: AuditFiltersDto
  ): Promise<AuditEvent[]> {
    return this.prisma.auditEvent.findMany({
      where: {
        organizationId,
        entityType: filters.entityType,
        entityId: filters.entityId,
        actorUserId: filters.actorUserId,
        actionType: filters.actionType
      },
      orderBy: { occurredAt: "desc" },
      take: 200
    });
  }
}


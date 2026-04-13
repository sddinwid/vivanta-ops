import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditFiltersDto } from "../dto/audit-filters.dto";
import { AuditRepository } from "../repositories/audit.repository";

interface RecordAuditInput {
  organizationId: string;
  actorUserId?: string;
  actionType: string;
  entityType: string;
  entityId?: string;
  oldValues?: Prisma.JsonValue;
  newValues?: Prisma.JsonValue;
  metadata?: Prisma.JsonValue;
}

@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  record(input: RecordAuditInput) {
    return this.auditRepository.create({
      organization: { connect: { id: input.organizationId } },
      actorUser: input.actorUserId
        ? { connect: { id: input.actorUserId } }
        : undefined,
      actionType: input.actionType,
      entityType: input.entityType,
      entityId: input.entityId,
      oldValues: input.oldValues,
      newValues: input.newValues,
      metadata: input.metadata
    });
  }

  async list(organizationId: string, filters: AuditFiltersDto) {
    const events = await this.auditRepository.list(organizationId, filters);
    return {
      data: events,
      meta: {
        total: events.length
      }
    };
  }
}


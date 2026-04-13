import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CaseStatus } from "@prisma/client";
import { AuditService } from "../../audit/services/audit.service";
import { CasesRepository } from "../repositories/cases.repository";

const allowedTransitions: Record<CaseStatus, CaseStatus[]> = {
  OPEN: [CaseStatus.IN_PROGRESS, CaseStatus.WAITING, CaseStatus.CANCELLED],
  IN_PROGRESS: [
    CaseStatus.WAITING,
    CaseStatus.RESOLVED,
    CaseStatus.CANCELLED,
    CaseStatus.OPEN
  ],
  WAITING: [CaseStatus.IN_PROGRESS, CaseStatus.CANCELLED, CaseStatus.OPEN],
  RESOLVED: [CaseStatus.CLOSED, CaseStatus.IN_PROGRESS],
  CLOSED: [],
  CANCELLED: []
};

@Injectable()
export class CaseStatusService {
  constructor(
    private readonly casesRepository: CasesRepository,
    private readonly auditService: AuditService
  ) {}

  async changeStatus(params: {
    organizationId: string;
    actorUserId: string;
    caseId: string;
    status: CaseStatus;
    ownerVisibleStatus?: string;
    note?: string;
    requestId?: string;
  }) {
    const {
      organizationId,
      actorUserId,
      caseId,
      status,
      ownerVisibleStatus,
      note,
      requestId
    } = params;

    const item = await this.casesRepository.findByIdScoped(caseId, organizationId);
    if (!item) {
      throw new NotFoundException("Case not found");
    }

    const transitions = allowedTransitions[item.status];
    if (!transitions.includes(status) && item.status !== status) {
      throw new BadRequestException(
        `Invalid case status transition from ${item.status} to ${status}`
      );
    }

    const updated = await this.casesRepository.update(caseId, {
      status,
      ownerVisibleStatus,
      closedAt:
        status === CaseStatus.CLOSED || status === CaseStatus.CANCELLED
          ? new Date()
          : null
    });

    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "case.status_change",
      entityType: "Case",
      entityId: caseId,
      oldValues: { status: item.status, ownerVisibleStatus: item.ownerVisibleStatus },
      newValues: { status: updated.status, ownerVisibleStatus: updated.ownerVisibleStatus },
      metadata: { requestId, note }
    });

    return updated;
  }
}


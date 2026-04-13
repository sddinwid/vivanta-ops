import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { AuditService } from "../../audit/services/audit.service";
import { CasesRepository } from "../repositories/cases.repository";

@Injectable()
export class CaseAssignmentService {
  constructor(
    private readonly casesRepository: CasesRepository,
    private readonly auditService: AuditService
  ) {}

  async assignCase(params: {
    organizationId: string;
    actorUserId: string;
    caseId: string;
    assignedUserId: string | null;
    requestId?: string;
  }) {
    const { organizationId, actorUserId, caseId, assignedUserId, requestId } =
      params;
    const item = await this.casesRepository.findByIdScoped(caseId, organizationId);
    if (!item) {
      throw new NotFoundException("Case not found");
    }

    if (assignedUserId) {
      const assignee = await this.casesRepository.findUserInOrganization(
        assignedUserId,
        organizationId
      );
      if (!assignee) {
        throw new BadRequestException(
          "assignedUserId must belong to the same organization"
        );
      }
    }

    const updated = await this.casesRepository.update(caseId, {
      assignedUserId
    });
    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "case.assign",
      entityType: "Case",
      entityId: caseId,
      oldValues: { assignedUserId: item.assignedUserId },
      newValues: { assignedUserId: updated.assignedUserId },
      metadata: { requestId }
    });
    return updated;
  }
}


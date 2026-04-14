import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { CaseStatus, OperationalPriority } from "@prisma/client";
import { AuditService } from "../../audit/services/audit.service";
import { AssignCaseDto } from "../dto/assign-case.dto";
import { CaseFiltersDto } from "../dto/case-filters.dto";
import { ChangeCaseStatusDto } from "../dto/change-case-status.dto";
import { CreateCaseDto } from "../dto/create-case.dto";
import { UpdateCaseDto } from "../dto/update-case.dto";
import { CaseMapper } from "../mappers/case.mapper";
import { CasesRepository } from "../repositories/cases.repository";
import { AiSuggestionMapper } from "../../ai/mappers/ai-suggestion.mapper";
import { CaseAssignmentService } from "./case-assignment.service";
import { CaseAiService } from "./case-ai.service";
import { CaseStatusService } from "./case-status.service";
import { WorkflowFacadeService } from "../../workflows/services/workflow-facade.service";

@Injectable()
export class CasesService {
  private readonly logger = new Logger(CasesService.name);

  constructor(
    private readonly casesRepository: CasesRepository,
    private readonly caseAssignmentService: CaseAssignmentService,
    private readonly caseStatusService: CaseStatusService,
    private readonly caseAiService: CaseAiService,
    private readonly auditService: AuditService,
    private readonly workflowFacadeService: WorkflowFacadeService
  ) {}

  async list(organizationId: string, filters: CaseFiltersDto) {
    const [data, total] = await Promise.all([
      this.casesRepository.listByOrganization(organizationId, filters),
      this.casesRepository.countByOrganization(organizationId, filters)
    ]);
    return {
      data: data.map(CaseMapper.toResponse),
      meta: { total, limit: filters.limit ?? 25, offset: filters.offset ?? 0 }
    };
  }

  async create(params: {
    organizationId: string;
    actorUserId: string;
    dto: CreateCaseDto;
    requestId?: string;
  }) {
    const { organizationId, actorUserId, dto, requestId } = params;
    await this.validateLinks(organizationId, dto.propertyId, dto.unitId);
    if (dto.assignedUserId) {
      const assigned = await this.casesRepository.findUserInOrganization(
        dto.assignedUserId,
        organizationId
      );
      if (!assigned) {
        throw new BadRequestException(
          "assignedUserId must belong to the same organization"
        );
      }
    }

    const item = await this.casesRepository.create({
      organization: { connect: { id: organizationId } },
      property: dto.propertyId ? { connect: { id: dto.propertyId } } : undefined,
      unit: dto.unitId ? { connect: { id: dto.unitId } } : undefined,
      caseType: dto.caseType,
      title: dto.title,
      description: dto.description,
      status: dto.status ?? CaseStatus.OPEN,
      priority: dto.priority ?? OperationalPriority.NORMAL,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
      createdByUser: { connect: { id: actorUserId } },
      assignedUser: dto.assignedUserId
        ? { connect: { id: dto.assignedUserId } }
        : undefined,
      ownerVisibleStatus: dto.ownerVisibleStatus
    });

    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "case.create",
      entityType: "Case",
      entityId: item.id,
      newValues: CaseMapper.toResponse(item),
      metadata: { requestId }
    });
    try {
      await this.workflowFacadeService.startCaseLifecycleWorkflow({
        organizationId,
        caseId: item.id,
        actorUserId,
        requestId
      });
    } catch (error) {
      this.logger.warn(
        `Case workflow visibility hook failed for caseId=${item.id}: ${error instanceof Error ? error.message : "unknown error"}`
      );
    }

    // Assistive-only: case categorization + workflow recommendations; never auto-mutate case state.
    void this.caseAiService
      .runCaseRecommendation({
        organizationId,
        actorUserId,
        caseId: item.id,
        trigger: "case_create",
        requestId
      })
      .catch((error) => {
        this.logger.warn(
          `Case AI assist failed for caseId=${item.id}: ${error instanceof Error ? error.message : "unknown error"}`
        );
      });

    return CaseMapper.toResponse(item);
  }

  async getById(organizationId: string, caseId: string) {
    const item = await this.casesRepository.findByIdScoped(caseId, organizationId);
    if (!item) {
      throw new NotFoundException("Case not found");
    }
    return CaseMapper.toResponse(item);
  }

  async update(params: {
    organizationId: string;
    actorUserId: string;
    caseId: string;
    dto: UpdateCaseDto;
    requestId?: string;
  }) {
    const { organizationId, actorUserId, caseId, dto, requestId } = params;
    const existing = await this.casesRepository.findByIdScoped(caseId, organizationId);
    if (!existing) {
      throw new NotFoundException("Case not found");
    }
    if (dto.status) {
      throw new BadRequestException(
        "Use /cases/:caseId/change-status for status transitions"
      );
    }
    await this.validateLinks(
      organizationId,
      dto.propertyId === null ? undefined : dto.propertyId,
      dto.unitId === null ? undefined : dto.unitId
    );

    const updated = await this.casesRepository.update(caseId, {
      title: dto.title,
      description: dto.description,
      status: dto.status,
      priority: dto.priority,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : dto.dueAt === null ? null : undefined,
      property:
        dto.propertyId === null
          ? { disconnect: true }
          : dto.propertyId
            ? { connect: { id: dto.propertyId } }
            : undefined,
      unit:
        dto.unitId === null
          ? { disconnect: true }
          : dto.unitId
            ? { connect: { id: dto.unitId } }
            : undefined,
      ownerVisibleStatus: dto.ownerVisibleStatus
    });

    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "case.update",
      entityType: "Case",
      entityId: caseId,
      oldValues: CaseMapper.toResponse(existing),
      newValues: CaseMapper.toResponse(updated),
      metadata: { requestId }
    });

    return CaseMapper.toResponse(updated);
  }

  async listAiSuggestionsScoped(params: { organizationId: string; caseId: string; limit?: number }) {
    const suggestions = await this.caseAiService.listCaseSuggestions(params);
    return {
      data: {
        recommendations: suggestions.map(AiSuggestionMapper.toResponse)
      },
      meta: { total: suggestions.length }
    };
  }

  async applyAiSuggestionScoped(params: {
    organizationId: string;
    actorUserId: string;
    caseId: string;
    suggestionId: string;
    applyCaseType?: boolean;
    applyPriority?: boolean;
    requestId?: string;
    note?: string;
  }) {
    const result = await this.caseAiService.applyCaseSuggestion(params);
    return {
      data: {
        case: CaseMapper.toResponse(result.case),
        suggestionId: result.suggestionId,
        appliedNow: result.appliedNow,
        appliedFields: result.appliedFields,
        recommendation: result.recommendation
      }
    };
  }

  assign(params: {
    organizationId: string;
    actorUserId: string;
    caseId: string;
    dto: AssignCaseDto;
    requestId?: string;
  }) {
    return this.caseAssignmentService.assignCase({
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      caseId: params.caseId,
      assignedUserId: params.dto.assignedUserId,
      requestId: params.requestId
    }).then(CaseMapper.toResponse);
  }

  changeStatus(params: {
    organizationId: string;
    actorUserId: string;
    caseId: string;
    dto: ChangeCaseStatusDto;
    requestId?: string;
  }) {
    return this.caseStatusService.changeStatus({
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      caseId: params.caseId,
      status: params.dto.status,
      ownerVisibleStatus: params.dto.ownerVisibleStatus,
      note: params.dto.note,
      requestId: params.requestId
    }).then(CaseMapper.toResponse);
  }

  async queueOpen(organizationId: string) {
    const data = await this.casesRepository.queueOpen(organizationId);
    return { data: data.map(CaseMapper.toResponse), meta: { total: data.length } };
  }

  async queueEscalated(organizationId: string) {
    const data = await this.casesRepository.queueEscalated(organizationId);
    return { data: data.map(CaseMapper.toResponse), meta: { total: data.length } };
  }

  async queueWaiting(organizationId: string) {
    const data = await this.casesRepository.queueWaiting(organizationId);
    return { data: data.map(CaseMapper.toResponse), meta: { total: data.length } };
  }

  private async validateLinks(
    organizationId: string,
    propertyId?: string,
    unitId?: string
  ): Promise<void> {
    if (propertyId) {
      const property = await this.casesRepository.findPropertyInOrganization(
        propertyId,
        organizationId
      );
      if (!property) {
        throw new BadRequestException(
          "propertyId must belong to the same organization"
        );
      }
    }

    if (unitId) {
      const unit = await this.casesRepository.findUnitInOrganization(
        unitId,
        organizationId
      );
      if (!unit) {
        throw new BadRequestException(
          "unitId must belong to the same organization"
        );
      }
      if (propertyId && unit.propertyId !== propertyId) {
        throw new BadRequestException("unitId must belong to the selected property");
      }
    }
  }
}

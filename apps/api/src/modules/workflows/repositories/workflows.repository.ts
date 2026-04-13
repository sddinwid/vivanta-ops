import { Injectable } from "@nestjs/common";
import { Prisma, WorkflowRun } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";
import { WorkflowFiltersDto } from "../dto/workflow-filters.dto";

@Injectable()
export class WorkflowsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByOrganization(organizationId: string, filters: WorkflowFiltersDto) {
    return this.prisma.workflowRun.findMany({
      where: {
        organizationId,
        workflowType: filters.workflowType,
        status: filters.status,
        targetEntityType: filters.targetEntityType,
        targetEntityId: filters.targetEntityId,
        orchestrationProvider: filters.orchestrationProvider
      },
      orderBy: { startedAt: "desc" },
      skip: filters.offset,
      take: filters.limit
    });
  }

  countByOrganization(organizationId: string, filters: WorkflowFiltersDto): Promise<number> {
    return this.prisma.workflowRun.count({
      where: {
        organizationId,
        workflowType: filters.workflowType,
        status: filters.status,
        targetEntityType: filters.targetEntityType,
        targetEntityId: filters.targetEntityId,
        orchestrationProvider: filters.orchestrationProvider
      }
    });
  }

  findByIdScoped(workflowRunId: string, organizationId: string) {
    return this.prisma.workflowRun.findFirst({
      where: {
        id: workflowRunId,
        organizationId
      }
    });
  }

  create(data: Prisma.WorkflowRunCreateInput): Promise<WorkflowRun> {
    return this.prisma.workflowRun.create({ data });
  }

  update(workflowRunId: string, data: Prisma.WorkflowRunUpdateInput): Promise<WorkflowRun> {
    return this.prisma.workflowRun.update({
      where: { id: workflowRunId },
      data
    });
  }
}

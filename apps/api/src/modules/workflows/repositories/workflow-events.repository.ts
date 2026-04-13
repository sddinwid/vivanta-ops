import { Injectable } from "@nestjs/common";
import { Prisma, WorkflowEvent } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";

@Injectable()
export class WorkflowEventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByWorkflowRun(workflowRunId: string): Promise<WorkflowEvent[]> {
    return this.prisma.workflowEvent.findMany({
      where: { workflowRunId },
      orderBy: { createdAt: "asc" }
    });
  }

  create(data: Prisma.WorkflowEventCreateInput): Promise<WorkflowEvent> {
    return this.prisma.workflowEvent.create({ data });
  }
}

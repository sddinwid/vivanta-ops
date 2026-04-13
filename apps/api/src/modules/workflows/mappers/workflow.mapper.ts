import { WorkflowEvent, WorkflowRun } from "@prisma/client";

export class WorkflowMapper {
  static runToResponse(run: WorkflowRun) {
    return {
      id: run.id,
      organizationId: run.organizationId,
      workflowType: run.workflowType,
      targetEntityType: run.targetEntityType,
      targetEntityId: run.targetEntityId,
      orchestrationProvider: run.orchestrationProvider,
      orchestrationRunId: run.orchestrationRunId,
      status: run.status,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      lastHeartbeatAt: run.lastHeartbeatAt,
      createdAt: run.createdAt
    };
  }

  static eventToResponse(event: WorkflowEvent) {
    return {
      id: event.id,
      workflowRunId: event.workflowRunId,
      eventType: event.eventType,
      eventPayload: event.eventPayload,
      createdAt: event.createdAt
    };
  }
}

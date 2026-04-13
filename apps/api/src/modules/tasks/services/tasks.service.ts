import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { OperationalPriority, TaskStatus } from "@prisma/client";
import { AuditService } from "../../audit/services/audit.service";
import { AssignTaskDto } from "../dto/assign-task.dto";
import { ChangeTaskStatusDto } from "../dto/change-task-status.dto";
import { CreateTaskDto } from "../dto/create-task.dto";
import { TaskFiltersDto } from "../dto/task-filters.dto";
import { UpdateTaskDto } from "../dto/update-task.dto";
import { TaskMapper } from "../mappers/task.mapper";
import { TasksRepository } from "../repositories/tasks.repository";

const taskTransitions: Record<TaskStatus, TaskStatus[]> = {
  OPEN: [TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED, TaskStatus.CANCELLED],
  IN_PROGRESS: [TaskStatus.BLOCKED, TaskStatus.DONE, TaskStatus.CANCELLED, TaskStatus.OPEN],
  BLOCKED: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED, TaskStatus.OPEN],
  DONE: [],
  CANCELLED: []
};

@Injectable()
export class TasksService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly auditService: AuditService
  ) {}

  async list(organizationId: string, filters: TaskFiltersDto) {
    const [data, total] = await Promise.all([
      this.tasksRepository.listByOrganization(organizationId, filters),
      this.tasksRepository.countByOrganization(organizationId, filters)
    ]);
    return {
      data: data.map(TaskMapper.toResponse),
      meta: { total, limit: filters.limit ?? 25, offset: filters.offset ?? 0 }
    };
  }

  async create(params: {
    organizationId: string;
    actorUserId: string;
    dto: CreateTaskDto;
    requestId?: string;
  }) {
    const { organizationId, actorUserId, dto, requestId } = params;
    if (dto.assignedUserId) {
      const user = await this.tasksRepository.findUserInOrganization(
        dto.assignedUserId,
        organizationId
      );
      if (!user) {
        throw new BadRequestException(
          "assignedUserId must belong to the same organization"
        );
      }
    }

    const item = await this.tasksRepository.create({
      organization: { connect: { id: organizationId } },
      taskType: dto.taskType,
      title: dto.title,
      description: dto.description,
      status: dto.status ?? TaskStatus.OPEN,
      priority: dto.priority ?? OperationalPriority.NORMAL,
      assignedUser: dto.assignedUserId
        ? { connect: { id: dto.assignedUserId } }
        : undefined,
      relatedEntityType: dto.relatedEntityType,
      relatedEntityId: dto.relatedEntityId,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined
    });

    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "task.create",
      entityType: "Task",
      entityId: item.id,
      newValues: TaskMapper.toResponse(item),
      metadata: { requestId }
    });
    return TaskMapper.toResponse(item);
  }

  async getById(organizationId: string, taskId: string) {
    const item = await this.tasksRepository.findByIdScoped(taskId, organizationId);
    if (!item) {
      throw new NotFoundException("Task not found");
    }
    return TaskMapper.toResponse(item);
  }

  async update(params: {
    organizationId: string;
    actorUserId: string;
    taskId: string;
    dto: UpdateTaskDto;
    requestId?: string;
  }) {
    const { organizationId, actorUserId, taskId, dto, requestId } = params;
    const existing = await this.tasksRepository.findByIdScoped(taskId, organizationId);
    if (!existing) {
      throw new NotFoundException("Task not found");
    }
    if (dto.status) {
      throw new BadRequestException(
        "Use /tasks/:taskId/change-status for status transitions"
      );
    }

    const updated = await this.tasksRepository.update(taskId, {
      title: dto.title,
      description: dto.description,
      status: dto.status,
      priority: dto.priority,
      relatedEntityType: dto.relatedEntityType,
      relatedEntityId: dto.relatedEntityId,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : dto.dueAt === null ? null : undefined
    });

    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "task.update",
      entityType: "Task",
      entityId: taskId,
      oldValues: TaskMapper.toResponse(existing),
      newValues: TaskMapper.toResponse(updated),
      metadata: { requestId }
    });
    return TaskMapper.toResponse(updated);
  }

  async assign(params: {
    organizationId: string;
    actorUserId: string;
    taskId: string;
    dto: AssignTaskDto;
    requestId?: string;
  }) {
    const { organizationId, actorUserId, taskId, dto, requestId } = params;
    const existing = await this.tasksRepository.findByIdScoped(taskId, organizationId);
    if (!existing) {
      throw new NotFoundException("Task not found");
    }

    if (dto.assignedUserId) {
      const user = await this.tasksRepository.findUserInOrganization(
        dto.assignedUserId,
        organizationId
      );
      if (!user) {
        throw new BadRequestException(
          "assignedUserId must belong to the same organization"
        );
      }
    }

    const updated = await this.tasksRepository.update(taskId, {
      assignedUserId: dto.assignedUserId
    });
    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "task.assign",
      entityType: "Task",
      entityId: taskId,
      oldValues: { assignedUserId: existing.assignedUserId },
      newValues: { assignedUserId: updated.assignedUserId },
      metadata: { requestId }
    });
    return TaskMapper.toResponse(updated);
  }

  async changeStatus(params: {
    organizationId: string;
    actorUserId: string;
    taskId: string;
    dto: ChangeTaskStatusDto;
    requestId?: string;
  }) {
    const { organizationId, actorUserId, taskId, dto, requestId } = params;
    const existing = await this.tasksRepository.findByIdScoped(taskId, organizationId);
    if (!existing) {
      throw new NotFoundException("Task not found");
    }
    if (!taskTransitions[existing.status].includes(dto.status) && existing.status !== dto.status) {
      throw new BadRequestException(
        `Invalid task status transition from ${existing.status} to ${dto.status}`
      );
    }

    const updated = await this.tasksRepository.update(taskId, {
      status: dto.status,
      completedAt: dto.status === TaskStatus.DONE ? new Date() : null
    });
    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "task.status_change",
      entityType: "Task",
      entityId: taskId,
      oldValues: { status: existing.status },
      newValues: { status: updated.status },
      metadata: { requestId, note: dto.note }
    });
    return TaskMapper.toResponse(updated);
  }

  async queueMyWork(organizationId: string, userId: string) {
    const data = await this.tasksRepository.queueMyWork(organizationId, userId);
    return { data: data.map(TaskMapper.toResponse), meta: { total: data.length } };
  }

  async queueReview(organizationId: string) {
    const data = await this.tasksRepository.queueReview(organizationId);
    return { data: data.map(TaskMapper.toResponse), meta: { total: data.length } };
  }
}

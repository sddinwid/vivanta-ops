import { Injectable } from "@nestjs/common";
import { Prisma, Task, TaskStatus } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";
import { TaskFiltersDto } from "../dto/task-filters.dto";

@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByOrganization(organizationId: string, filters: TaskFiltersDto): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: {
        organizationId,
        status: filters.status,
        priority: filters.priority,
        assignedUserId: filters.assignedUserId,
        relatedEntityType: filters.relatedEntityType,
        relatedEntityId: filters.relatedEntityId,
        createdAt:
          filters.createdFrom || filters.createdTo
            ? {
                gte: filters.createdFrom
                  ? new Date(filters.createdFrom)
                  : undefined,
                lte: filters.createdTo ? new Date(filters.createdTo) : undefined
              }
            : undefined,
        OR: filters.search
          ? [
              { title: { contains: filters.search, mode: "insensitive" } },
              { description: { contains: filters.search, mode: "insensitive" } }
            ]
          : undefined
      },
      orderBy: { updatedAt: "desc" },
      skip: filters.offset,
      take: filters.limit
    });
  }

  countByOrganization(organizationId: string, filters: TaskFiltersDto): Promise<number> {
    return this.prisma.task.count({
      where: {
        organizationId,
        status: filters.status,
        priority: filters.priority,
        assignedUserId: filters.assignedUserId,
        relatedEntityType: filters.relatedEntityType,
        relatedEntityId: filters.relatedEntityId,
        createdAt:
          filters.createdFrom || filters.createdTo
            ? {
                gte: filters.createdFrom
                  ? new Date(filters.createdFrom)
                  : undefined,
                lte: filters.createdTo ? new Date(filters.createdTo) : undefined
              }
            : undefined,
        OR: filters.search
          ? [
              { title: { contains: filters.search, mode: "insensitive" } },
              { description: { contains: filters.search, mode: "insensitive" } }
            ]
          : undefined
      }
    });
  }

  findByIdScoped(taskId: string, organizationId: string): Promise<Task | null> {
    return this.prisma.task.findFirst({
      where: { id: taskId, organizationId }
    });
  }

  create(data: Prisma.TaskCreateInput): Promise<Task> {
    return this.prisma.task.create({ data });
  }

  update(taskId: string, data: Prisma.TaskUpdateInput): Promise<Task> {
    return this.prisma.task.update({
      where: { id: taskId },
      data
    });
  }

  findUserInOrganization(userId: string, organizationId: string) {
    return this.prisma.user.findFirst({
      where: { id: userId, organizationId },
      select: { id: true }
    });
  }

  queueMyWork(organizationId: string, userId: string): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: {
        organizationId,
        assignedUserId: userId,
        status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] }
      },
      orderBy: { updatedAt: "desc" },
      take: 100
    });
  }

  queueReview(organizationId: string): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: {
        organizationId,
        OR: [
          { taskType: { contains: "review", mode: "insensitive" } },
          { status: { in: [TaskStatus.OPEN, TaskStatus.BLOCKED] } }
        ]
      },
      orderBy: { updatedAt: "desc" },
      take: 100
    });
  }
}


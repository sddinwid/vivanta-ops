import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException
} from "@nestjs/common";
import {
  CommunicationPriority,
  CommunicationThreadStatus,
  MessageDirection
} from "@prisma/client";
import { AuditService } from "../../audit/services/audit.service";
import { AssignThreadDto } from "../dto/assign-thread.dto";
import { CommunicationFiltersDto } from "../dto/communication-filters.dto";
import { CreateMessageDto } from "../dto/create-message.dto";
import { CreateThreadDto } from "../dto/create-thread.dto";
import { LinkThreadDto } from "../dto/link-thread.dto";
import { UpdateThreadDto } from "../dto/update-thread.dto";
import { CommunicationMapper } from "../mappers/communication.mapper";
import { MessageMapper } from "../mappers/message.mapper";
import { CommunicationsRepository } from "../repositories/communications.repository";
import { MessageAttachmentsRepository } from "../repositories/message-attachments.repository";
import { MessagesRepository } from "../repositories/messages.repository";
import { AiSuggestionMapper } from "../../ai/mappers/ai-suggestion.mapper";
import { CommunicationAssignmentService } from "./communication-assignment.service";
import { CommunicationAiService } from "./communication-ai.service";
import { CommunicationLinkingService } from "./communication-linking.service";
import { WorkflowFacadeService } from "../../workflows/services/workflow-facade.service";

@Injectable()
export class CommunicationsService {
  private readonly logger = new Logger(CommunicationsService.name);

  constructor(
    private readonly communicationsRepository: CommunicationsRepository,
    private readonly messagesRepository: MessagesRepository,
    private readonly messageAttachmentsRepository: MessageAttachmentsRepository,
    private readonly communicationAssignmentService: CommunicationAssignmentService,
    private readonly communicationLinkingService: CommunicationLinkingService,
    private readonly communicationAiService: CommunicationAiService,
    private readonly auditService: AuditService,
    private readonly workflowFacadeService: WorkflowFacadeService
  ) {}

  async listThreads(
    organizationId: string,
    filters: CommunicationFiltersDto
  ): Promise<{ data: unknown[]; meta: Record<string, unknown> }> {
    const [threads, total] = await Promise.all([
      this.communicationsRepository.listByOrganization(organizationId, filters),
      this.communicationsRepository.countByOrganization(organizationId, filters)
    ]);

    return {
      data: threads.map(CommunicationMapper.toResponse),
      meta: {
        total,
        limit: filters.limit ?? 25,
        offset: filters.offset ?? 0
      }
    };
  }

  async createThread(params: {
    organizationId: string;
    actorUserId: string;
    dto: CreateThreadDto;
    requestId?: string;
  }): Promise<unknown> {
    const { organizationId, actorUserId, dto, requestId } = params;

    if (
      (dto.linkedEntityType && !dto.linkedEntityId) ||
      (!dto.linkedEntityType && dto.linkedEntityId)
    ) {
      throw new BadRequestException(
        "Thread linking requires both linkedEntityType and linkedEntityId"
      );
    }

    if (dto.assignedUserId) {
      const assignee = await this.communicationsRepository.findUserInOrganization(
        dto.assignedUserId,
        organizationId
      );
      if (!assignee) {
        throw new BadRequestException(
          "assignedUserId must belong to the same organization"
        );
      }
    }

    if (dto.linkedEntityType && dto.linkedEntityId) {
      await this.communicationLinkingService.validateLinkedEntity({
        organizationId,
        linkedEntityType: dto.linkedEntityType,
        linkedEntityId: dto.linkedEntityId
      });
    }

    const thread = await this.communicationsRepository.create({
      organization: { connect: { id: organizationId } },
      channelType: dto.channelType,
      subject: dto.subject,
      status: dto.status ?? CommunicationThreadStatus.OPEN,
      priority: dto.priority ?? CommunicationPriority.NORMAL,
      linkedEntityType: dto.linkedEntityType,
      linkedEntityId: dto.linkedEntityId,
      createdByUser: { connect: { id: actorUserId } },
      assignedUser: dto.assignedUserId
        ? { connect: { id: dto.assignedUserId } }
        : undefined
    });

    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "communication.thread.create",
      entityType: "CommunicationThread",
      entityId: thread.id,
      newValues: CommunicationMapper.toResponse(thread),
      metadata: { requestId }
    });
    try {
      await this.workflowFacadeService.startCommunicationTriageWorkflow({
        organizationId,
        communicationThreadId: thread.id,
        actorUserId,
        requestId
      });
    } catch (error) {
      this.logger.warn(
        `Communication workflow visibility hook failed for threadId=${thread.id}: ${error instanceof Error ? error.message : "unknown error"}`
      );
    }

    if (dto.initialMessage) {
      await this.createMessage({
        organizationId,
        actorUserId,
        threadId: thread.id,
        dto: dto.initialMessage,
        requestId
      });
    } else {
      // Assistive-only: triage + summary suggestions; never auto-mutate thread state.
      void this.communicationAiService
        .runAssistiveTriageAndSummary({
          organizationId,
          actorUserId,
          threadId: thread.id,
          trigger: "thread_create",
          requestId
        })
        .catch((error) => {
          this.logger.warn(
            `Communication AI assist failed for threadId=${thread.id}: ${error instanceof Error ? error.message : "unknown error"}`
          );
        });
    }

    return CommunicationMapper.toResponse(thread);
  }

  async getThreadById(organizationId: string, threadId: string): Promise<unknown> {
    const thread = await this.requireScopedThread(threadId, organizationId);
    return CommunicationMapper.toResponse(thread);
  }

  async updateThread(params: {
    organizationId: string;
    actorUserId: string;
    threadId: string;
    dto: UpdateThreadDto;
    requestId?: string;
  }): Promise<unknown> {
    const { organizationId, actorUserId, threadId, dto, requestId } = params;
    const existing = await this.requireScopedThread(threadId, organizationId);
    const updated = await this.communicationsRepository.update(threadId, {
      subject: dto.subject,
      status: dto.status,
      priority: dto.priority
    });
    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "communication.thread.update",
      entityType: "CommunicationThread",
      entityId: threadId,
      oldValues: CommunicationMapper.toResponse(existing),
      newValues: CommunicationMapper.toResponse(updated),
      metadata: { requestId }
    });
    return CommunicationMapper.toResponse(updated);
  }

  async assignThread(params: {
    organizationId: string;
    actorUserId: string;
    threadId: string;
    dto: AssignThreadDto;
    requestId?: string;
  }): Promise<unknown> {
    const updated = await this.communicationAssignmentService.assignThread({
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      threadId: params.threadId,
      assignedUserId: params.dto.assignedUserId,
      requestId: params.requestId
    });
    return CommunicationMapper.toResponse(updated);
  }

  async linkThread(params: {
    organizationId: string;
    actorUserId: string;
    threadId: string;
    dto: LinkThreadDto;
    requestId?: string;
  }): Promise<unknown> {
    const updated = await this.communicationLinkingService.linkThread({
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      threadId: params.threadId,
      linkedEntityType: params.dto.linkedEntityType,
      linkedEntityId: params.dto.linkedEntityId,
      requestId: params.requestId
    });
    return CommunicationMapper.toResponse(updated);
  }

  async listMessages(
    organizationId: string,
    threadId: string
  ): Promise<{ data: unknown[]; meta: Record<string, unknown> }> {
    await this.requireScopedThread(threadId, organizationId);
    const messages = await this.messagesRepository.listByThread(threadId);
    return {
      data: messages.map(MessageMapper.toResponse),
      meta: { total: messages.length }
    };
  }

  async createMessage(params: {
    organizationId: string;
    actorUserId: string;
    threadId: string;
    dto: CreateMessageDto;
    requestId?: string;
  }): Promise<unknown> {
    const { organizationId, actorUserId, threadId, dto, requestId } = params;
    await this.requireScopedThread(threadId, organizationId);

    if (!dto.bodyText && !dto.bodyHtml) {
      throw new BadRequestException("Message bodyText or bodyHtml is required");
    }
    if (dto.documentIds && new Set(dto.documentIds).size !== dto.documentIds.length) {
      throw new BadRequestException("Duplicate documentIds are not allowed");
    }

    if (dto.documentIds && dto.documentIds.length > 0) {
      const validDocuments =
        await this.messageAttachmentsRepository.findDocumentsByOrganization(
          dto.documentIds,
          organizationId
        );
      if (validDocuments.length !== dto.documentIds.length) {
        throw new BadRequestException(
          "One or more attached documents are outside this organization"
        );
      }
    }

    const direction = dto.direction ?? MessageDirection.OUTBOUND;
    const message = await this.messagesRepository.create({
      thread: { connect: { id: threadId } },
      direction,
      senderType: dto.senderType,
      senderReferenceId: dto.senderReferenceId,
      bodyText: dto.bodyText,
      bodyHtml: dto.bodyHtml,
      messageStatus: dto.messageStatus,
      sentAt: direction === MessageDirection.OUTBOUND ? new Date() : undefined
    });

    await this.messagesRepository.touchThread(threadId);

    if (dto.documentIds && dto.documentIds.length > 0) {
      await this.messageAttachmentsRepository.createMany(message.id, dto.documentIds);
      await this.auditService.record({
        organizationId,
        actorUserId,
        actionType: "communication.message.attach_documents",
        entityType: "Message",
        entityId: message.id,
        newValues: { documentIds: dto.documentIds },
        metadata: { requestId }
      });
    }

    const attachments = await this.messageAttachmentsRepository.listByMessage(
      message.id
    );

    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "communication.message.create",
      entityType: "Message",
      entityId: message.id,
      newValues: MessageMapper.toResponse({
        ...message,
        attachments
      }),
      metadata: { requestId, threadId }
    });

    // Assistive-only: triage + summary suggestions; never auto-mutate thread state.
    void this.communicationAiService
      .runAssistiveTriageAndSummary({
        organizationId,
        actorUserId,
        threadId,
        trigger: "message_create",
        requestId
      })
      .catch((error) => {
        this.logger.warn(
          `Communication AI assist failed for threadId=${threadId}: ${error instanceof Error ? error.message : "unknown error"}`
        );
      });

    return MessageMapper.toResponse({
      ...message,
      attachments
    });
  }

  async listAiSuggestionsScoped(params: {
    organizationId: string;
    threadId: string;
    limit?: number;
  }) {
    const suggestions = await this.communicationAiService.listThreadSuggestions(params);
    return {
      data: {
        triage: suggestions.triage.map(AiSuggestionMapper.toResponse),
        summary: suggestions.summary.map(AiSuggestionMapper.toResponse)
      },
      meta: {
        total: suggestions.triage.length + suggestions.summary.length
      }
    };
  }

  async applyTriageSuggestionScoped(params: {
    organizationId: string;
    actorUserId: string;
    threadId: string;
    suggestionId: string;
    requestId?: string;
    note?: string;
  }) {
    const result = await this.communicationAiService.applyTriageSuggestion(params);
    return {
      data: {
        thread: CommunicationMapper.toResponse(result.thread),
        suggestionId: result.suggestionId,
        appliedNow: result.appliedNow,
        priorityChanged: result.priorityChanged
      }
    };
  }

  async applySummarySuggestionScoped(params: {
    organizationId: string;
    actorUserId: string;
    threadId: string;
    suggestionId: string;
    requestId?: string;
    note?: string;
  }) {
    const result = await this.communicationAiService.applySummarySuggestion(params);
    return {
      data: result
    };
  }

  async queueInbox(organizationId: string) {
    const threads = await this.communicationsRepository.queueInbox(organizationId);
    return {
      data: threads.map(CommunicationMapper.toResponse),
      meta: { total: threads.length }
    };
  }

  async queueUnassigned(organizationId: string) {
    const threads = await this.communicationsRepository.queueUnassigned(
      organizationId
    );
    return {
      data: threads.map(CommunicationMapper.toResponse),
      meta: { total: threads.length }
    };
  }

  async queueUrgent(organizationId: string) {
    const threads = await this.communicationsRepository.queueUrgent(organizationId);
    return {
      data: threads.map(CommunicationMapper.toResponse),
      meta: { total: threads.length }
    };
  }

  private async requireScopedThread(threadId: string, organizationId: string) {
    const thread = await this.communicationsRepository.findByIdScoped(
      threadId,
      organizationId
    );
    if (!thread) {
      throw new NotFoundException("Communication thread not found");
    }
    return thread;
  }
}

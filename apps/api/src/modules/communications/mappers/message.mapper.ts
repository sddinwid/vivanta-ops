import { Injectable } from "@nestjs/common";
import { Message } from "@prisma/client";

@Injectable()
export class MessageMapper {
  static toResponse(
    message: Message & {
      attachments?: { documentId: string; createdAt: Date }[];
    }
  ) {
    return {
      id: message.id,
      threadId: message.threadId,
      direction: message.direction,
      senderType: message.senderType,
      senderReferenceId: message.senderReferenceId,
      bodyText: message.bodyText,
      bodyHtml: message.bodyHtml,
      messageStatus: message.messageStatus,
      receivedAt: message.receivedAt,
      sentAt: message.sentAt,
      createdAt: message.createdAt,
      attachments:
        message.attachments?.map((attachment) => ({
          documentId: attachment.documentId,
          createdAt: attachment.createdAt
        })) ?? []
    };
  }
}


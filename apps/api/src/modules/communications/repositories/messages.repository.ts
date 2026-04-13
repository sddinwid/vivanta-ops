import { Injectable } from "@nestjs/common";
import { Message, Prisma } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";

@Injectable()
export class MessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByThread(threadId: string) {
    return this.prisma.message.findMany({
      where: { threadId },
      include: {
        attachments: true
      },
      orderBy: { createdAt: "asc" }
    });
  }

  create(data: Prisma.MessageCreateInput): Promise<Message> {
    return this.prisma.message.create({ data });
  }

  touchThread(threadId: string): Promise<void> {
    return this.prisma.communicationThread
      .update({
        where: { id: threadId },
        data: { updatedAt: new Date() },
        select: { id: true }
      })
      .then(() => undefined);
  }
}


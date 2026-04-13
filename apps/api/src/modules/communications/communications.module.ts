import { Module } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { PrismaModule } from "../../database/prisma/prisma.module";
import { AuditModule } from "../audit/audit.module";
import { WorkflowsModule } from "../workflows/workflows.module";
import { CommunicationsController } from "./controllers/communications.controller";
import { CommunicationMapper } from "./mappers/communication.mapper";
import { MessageMapper } from "./mappers/message.mapper";
import { CommunicationsRepository } from "./repositories/communications.repository";
import { MessageAttachmentsRepository } from "./repositories/message-attachments.repository";
import { MessagesRepository } from "./repositories/messages.repository";
import { CommunicationAssignmentService } from "./services/communication-assignment.service";
import { CommunicationLinkingService } from "./services/communication-linking.service";
import { CommunicationsService } from "./services/communications.service";

@Module({
  imports: [PrismaModule, AuditModule, WorkflowsModule],
  controllers: [CommunicationsController],
  providers: [
    CommunicationsService,
    CommunicationAssignmentService,
    CommunicationLinkingService,
    CommunicationsRepository,
    MessagesRepository,
    MessageAttachmentsRepository,
    CommunicationMapper,
    MessageMapper,
    JwtAuthGuard,
    PermissionsGuard
  ]
})
export class CommunicationsModule {}

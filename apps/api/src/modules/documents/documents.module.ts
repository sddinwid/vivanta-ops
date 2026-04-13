import { Module } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { PrismaModule } from "../../database/prisma/prisma.module";
import { StorageModule } from "../../infrastructure/storage/storage.module";
import { AuditModule } from "../audit/audit.module";
import { WorkflowsModule } from "../workflows/workflows.module";
import { DocumentsController } from "./controllers/documents.controller";
import { DocumentMapper } from "./mappers/document.mapper";
import { AttachmentsRepository } from "./repositories/attachments.repository";
import { DocumentLinksRepository } from "./repositories/document-links.repository";
import { DocumentsRepository } from "./repositories/documents.repository";
import { DocumentLinkingService } from "./services/document-linking.service";
import { DocumentsService } from "./services/documents.service";
import { DocumentStorageService } from "./services/document-storage.service";

@Module({
  imports: [PrismaModule, StorageModule, AuditModule, WorkflowsModule],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    DocumentLinkingService,
    DocumentStorageService,
    DocumentsRepository,
    DocumentLinksRepository,
    AttachmentsRepository,
    DocumentMapper,
    JwtAuthGuard,
    PermissionsGuard
  ]
})
export class DocumentsModule {}

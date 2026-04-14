import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequireAnyPermissions } from "../../../common/decorators/require-any-permissions.decorator";
import { RequirePermissions } from "../../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequestIdentity } from "../../../common/request-context/request-context.types";
import { ApplyDocumentAiSuggestionDto } from "../dto/apply-document-ai-suggestion.dto";
import { DocumentFiltersDto } from "../dto/document-filters.dto";
import { LinkDocumentDto } from "../dto/link-document.dto";
import { ReprocessDocumentDto } from "../dto/reprocess-document.dto";
import { UpdateDocumentDto } from "../dto/update-document.dto";
import { UploadDocumentDto } from "../dto/upload-document.dto";
import { DocumentsService } from "../services/documents.service";

@Controller("documents")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @RequirePermissions("document.read")
  list(
    @CurrentUser() identity: RequestIdentity,
    @Query() filters: DocumentFiltersDto
  ): Promise<unknown> {
    return this.documentsService.listScoped(identity.organizationId, filters);
  }

  @Post("upload")
  @RequirePermissions("document.write")
  @UseInterceptors(FileInterceptor("file"))
  upload(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @UploadedFile()
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
    @Body() dto: UploadDocumentDto
  ): Promise<unknown> {
    return this.documentsService.uploadScoped({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      file,
      dto,
      requestId: req.requestId
    });
  }

  @Get(":documentId")
  @RequirePermissions("document.read")
  getById(
    @CurrentUser() identity: RequestIdentity,
    @Param("documentId", new ParseUUIDPipe()) documentId: string
  ): Promise<unknown> {
    return this.documentsService.getByIdScoped(identity.organizationId, documentId);
  }

  @Get(":documentId/ai-suggestions")
  @RequireAnyPermissions("document.read", "ai.read")
  listAiSuggestions(
    @CurrentUser() identity: RequestIdentity,
    @Param("documentId", new ParseUUIDPipe()) documentId: string
  ): Promise<unknown> {
    return this.documentsService.listAiSuggestionsScoped({
      organizationId: identity.organizationId,
      documentId
    });
  }

  @Post(":documentId/apply-classification")
  @RequirePermissions("document.write")
  applyClassificationSuggestion(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("documentId", new ParseUUIDPipe()) documentId: string,
    @Body() dto: ApplyDocumentAiSuggestionDto
  ): Promise<unknown> {
    return this.documentsService.applyClassificationSuggestionScoped({
      organizationId: identity.organizationId,
      documentId,
      actorUserId: identity.userId,
      suggestionId: dto.suggestionId,
      note: dto.note,
      requestId: req.requestId
    });
  }

  @Post(":documentId/apply-extraction")
  @RequirePermissions("document.write")
  applyExtractionSuggestion(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("documentId", new ParseUUIDPipe()) documentId: string,
    @Body() dto: ApplyDocumentAiSuggestionDto
  ): Promise<unknown> {
    return this.documentsService.applyExtractionSuggestionScoped({
      organizationId: identity.organizationId,
      documentId,
      actorUserId: identity.userId,
      suggestionId: dto.suggestionId,
      note: dto.note,
      requestId: req.requestId
    });
  }

  @Patch(":documentId")
  @RequirePermissions("document.write")
  update(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("documentId", new ParseUUIDPipe()) documentId: string,
    @Body() dto: UpdateDocumentDto
  ): Promise<unknown> {
    return this.documentsService.updateScoped({
      organizationId: identity.organizationId,
      documentId,
      actorUserId: identity.userId,
      dto,
      requestId: req.requestId
    });
  }

  @Get(":documentId/download")
  @RequirePermissions("document.read")
  async download(
    @CurrentUser() identity: RequestIdentity,
    @Param("documentId", new ParseUUIDPipe()) documentId: string,
    @Res() res: Response
  ): Promise<void> {
    const download = await this.documentsService.getDownloadScoped(
      identity.organizationId,
      documentId
    );
    res.download(download.absolutePath, download.fileName);
  }

  @Get(":documentId/links")
  @RequirePermissions("document.read")
  listLinks(
    @CurrentUser() identity: RequestIdentity,
    @Param("documentId", new ParseUUIDPipe()) documentId: string
  ): Promise<unknown> {
    return this.documentsService.listLinksScoped(identity.organizationId, documentId);
  }

  @Post(":documentId/link")
  @RequirePermissions("document.link")
  linkDocument(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("documentId", new ParseUUIDPipe()) documentId: string,
    @Body() dto: LinkDocumentDto
  ): Promise<unknown> {
    return this.documentsService.createLinkScoped({
      organizationId: identity.organizationId,
      documentId,
      actorUserId: identity.userId,
      dto,
      requestId: req.requestId
    });
  }

  @Delete(":documentId/link")
  @RequirePermissions("document.link")
  unlinkDocument(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("documentId", new ParseUUIDPipe()) documentId: string,
    @Body() dto: LinkDocumentDto
  ): Promise<unknown> {
    return this.documentsService.deleteLinkScoped({
      organizationId: identity.organizationId,
      documentId,
      actorUserId: identity.userId,
      dto,
      requestId: req.requestId
    });
  }

  @Post(":documentId/reprocess")
  @RequirePermissions("document.reprocess")
  reprocess(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("documentId", new ParseUUIDPipe()) documentId: string,
    @Body() dto: ReprocessDocumentDto
  ): Promise<unknown> {
    return this.documentsService.reprocessScoped({
      organizationId: identity.organizationId,
      documentId,
      actorUserId: identity.userId,
      dto,
      requestId: req.requestId
    });
  }
}

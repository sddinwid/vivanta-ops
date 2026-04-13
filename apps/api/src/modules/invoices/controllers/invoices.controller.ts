import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequestIdentity } from "../../../common/request-context/request-context.types";
import { CreateInvoiceDto } from "../dto/create-invoice.dto";
import { CreateInvoiceLineDto } from "../dto/create-invoice-line.dto";
import { ExportInvoiceDto } from "../dto/export-invoice.dto";
import { InvoiceFiltersDto } from "../dto/invoice-filters.dto";
import { RejectInvoiceDto } from "../dto/reject-invoice.dto";
import { SubmitInvoiceForApprovalDto } from "../dto/submit-invoice-for-approval.dto";
import { SubmitInvoiceForReviewDto } from "../dto/submit-invoice-for-review.dto";
import { UpdateInvoiceDto } from "../dto/update-invoice.dto";
import { InvoiceApprovalService } from "../services/invoice-approval.service";
import { InvoiceReviewService } from "../services/invoice-review.service";
import { InvoicesService } from "../services/invoices.service";

@Controller("invoices")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly invoiceReviewService: InvoiceReviewService,
    private readonly invoiceApprovalService: InvoiceApprovalService
  ) {}

  @Get("queues/pending-review")
  @RequirePermissions("invoice.review")
  queuePendingReview(@CurrentUser() identity: RequestIdentity): Promise<unknown> {
    return this.invoicesService.queuePendingReview(identity.organizationId);
  }

  @Get("queues/pending-approval")
  @RequirePermissions("invoice.approve")
  queuePendingApproval(@CurrentUser() identity: RequestIdentity): Promise<unknown> {
    return this.invoicesService.queuePendingApproval(identity.organizationId);
  }

  @Get("queues/exceptions")
  @RequirePermissions("invoice.review")
  queueExceptions(@CurrentUser() identity: RequestIdentity): Promise<unknown> {
    return this.invoicesService.queueExceptions(identity.organizationId);
  }

  @Get()
  @RequirePermissions("invoice.read")
  list(
    @CurrentUser() identity: RequestIdentity,
    @Query() filters: InvoiceFiltersDto
  ): Promise<unknown> {
    return this.invoicesService.list(identity.organizationId, filters);
  }

  @Post()
  @RequirePermissions("invoice.write")
  create(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Body() dto: CreateInvoiceDto
  ): Promise<unknown> {
    return this.invoicesService.create({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      dto,
      requestId: req.requestId
    });
  }

  @Get(":invoiceId")
  @RequirePermissions("invoice.read")
  getById(
    @CurrentUser() identity: RequestIdentity,
    @Param("invoiceId", new ParseUUIDPipe()) invoiceId: string
  ): Promise<unknown> {
    return this.invoicesService.getById(identity.organizationId, invoiceId);
  }

  @Patch(":invoiceId")
  @RequirePermissions("invoice.write")
  update(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("invoiceId", new ParseUUIDPipe()) invoiceId: string,
    @Body() dto: UpdateInvoiceDto
  ): Promise<unknown> {
    return this.invoicesService.update({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      invoiceId,
      dto,
      requestId: req.requestId
    });
  }

  @Get(":invoiceId/lines")
  @RequirePermissions("invoice.read")
  listLines(
    @CurrentUser() identity: RequestIdentity,
    @Param("invoiceId", new ParseUUIDPipe()) invoiceId: string
  ): Promise<unknown> {
    return this.invoicesService.listLines(identity.organizationId, invoiceId);
  }

  @Post(":invoiceId/lines")
  @RequirePermissions("invoice.write")
  createLine(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("invoiceId", new ParseUUIDPipe()) invoiceId: string,
    @Body() dto: CreateInvoiceLineDto
  ): Promise<unknown> {
    return this.invoicesService.createLine({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      invoiceId,
      dto,
      requestId: req.requestId
    });
  }

  @Post(":invoiceId/submit-for-review")
  @RequirePermissions("invoice.review")
  submitForReview(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("invoiceId", new ParseUUIDPipe()) invoiceId: string,
    @Body() dto: SubmitInvoiceForReviewDto
  ): Promise<unknown> {
    return this.invoiceReviewService.submitForReview({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      invoiceId,
      dto,
      requestId: req.requestId
    });
  }

  @Post(":invoiceId/submit-for-approval")
  @RequirePermissions("invoice.review")
  submitForApproval(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("invoiceId", new ParseUUIDPipe()) invoiceId: string,
    @Body() dto: SubmitInvoiceForApprovalDto
  ): Promise<unknown> {
    return this.invoiceApprovalService.submitForApproval({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      invoiceId,
      dto,
      requestId: req.requestId
    });
  }

  @Post(":invoiceId/reject")
  @RequirePermissions("invoice.approve")
  reject(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("invoiceId", new ParseUUIDPipe()) invoiceId: string,
    @Body() dto: RejectInvoiceDto
  ): Promise<unknown> {
    return this.invoiceReviewService.reject({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      invoiceId,
      dto,
      requestId: req.requestId
    });
  }

  @Post(":invoiceId/export")
  @RequirePermissions("invoice.write")
  export(
    @CurrentUser() identity: RequestIdentity,
    @Req() req: { requestId?: string },
    @Param("invoiceId", new ParseUUIDPipe()) invoiceId: string,
    @Body() dto: ExportInvoiceDto
  ): Promise<unknown> {
    return this.invoiceApprovalService.export({
      organizationId: identity.organizationId,
      actorUserId: identity.userId,
      invoiceId,
      dto,
      requestId: req.requestId
    });
  }
}


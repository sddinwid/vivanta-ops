import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  AccountingExportStatus,
  InvoiceApprovalStatus
} from "@prisma/client";
import { AuditService } from "../../audit/services/audit.service";
import { ApprovalsService } from "../../approvals/services/approvals.service";
import { ExportInvoiceDto } from "../dto/export-invoice.dto";
import { SubmitInvoiceForApprovalDto } from "../dto/submit-invoice-for-approval.dto";
import { InvoiceMapper } from "../mappers/invoice.mapper";
import { InvoiceLinesRepository } from "../repositories/invoice-lines.repository";
import { InvoicesRepository } from "../repositories/invoices.repository";

@Injectable()
export class InvoiceApprovalService {
  constructor(
    private readonly approvalsService: ApprovalsService,
    private readonly invoicesRepository: InvoicesRepository,
    private readonly invoiceLinesRepository: InvoiceLinesRepository,
    private readonly auditService: AuditService
  ) {}

  async submitForApproval(params: {
    organizationId: string;
    actorUserId: string;
    invoiceId: string;
    dto: SubmitInvoiceForApprovalDto;
    requestId?: string;
  }) {
    const { organizationId, actorUserId, invoiceId, dto, requestId } = params;
    const invoice = await this.invoicesRepository.findByIdScoped(
      invoiceId,
      organizationId
    );
    if (!invoice) {
      throw new NotFoundException("Invoice not found");
    }
    if (
      ![
        InvoiceApprovalStatus.PENDING_REVIEW,
        InvoiceApprovalStatus.DRAFT
      ].includes(invoice.approvalStatus)
    ) {
      throw new BadRequestException(
        `Cannot submit invoice for approval from ${invoice.approvalStatus}`
      );
    }

    const lines = await this.invoiceLinesRepository.listByInvoice(invoiceId);
    if (!invoice.vendorId) {
      throw new BadRequestException("Invoice must have vendorId before approval");
    }
    if (!invoice.invoiceNumber) {
      throw new BadRequestException("Invoice must have invoiceNumber before approval");
    }
    if (invoice.totalAmount === null && lines.length === 0) {
      throw new BadRequestException(
        "Invoice requires totalAmount or at least one line before approval"
      );
    }

    let approverUserIds = dto.approverUserIds ?? [];
    if (approverUserIds.length > 0) {
      const valid = await this.invoicesRepository.listUsersInOrganization(
        organizationId,
        approverUserIds
      );
      if (valid.length !== approverUserIds.length) {
        throw new BadRequestException(
          "One or more approverUserIds are outside this organization"
        );
      }
    } else {
      const candidates = await this.invoicesRepository.listUsersByRoleNames(
        organizationId,
        ["finance", "admin"]
      );
      approverUserIds = [...new Set(candidates.map((candidate) => candidate.userId))];
      if (approverUserIds.length === 0) {
        throw new BadRequestException(
          "No finance/admin approvers available in this organization"
        );
      }
    }

    await this.invoicesRepository.update(invoiceId, {
      approvalStatus: InvoiceApprovalStatus.PENDING_APPROVAL
    });
    const flow = await this.approvalsService.createInvoiceApprovalFlow({
      organizationId,
      invoiceId,
      actorUserId,
      approverUserIds,
      requestId
    });

    const updated = await this.invoicesRepository.findByIdScoped(
      invoiceId,
      organizationId
    );
    if (!updated) {
      throw new NotFoundException("Invoice not found after submission");
    }
    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "invoice.submit_for_approval",
      entityType: "Invoice",
      entityId: invoiceId,
      oldValues: { approvalStatus: invoice.approvalStatus },
      newValues: { approvalStatus: updated.approvalStatus },
      metadata: { requestId, flowId: flow.id, approverUserIds }
    });
    return InvoiceMapper.toResponse(updated);
  }

  async export(params: {
    organizationId: string;
    actorUserId: string;
    invoiceId: string;
    dto: ExportInvoiceDto;
    requestId?: string;
  }) {
    const { organizationId, actorUserId, invoiceId, dto, requestId } = params;
    const invoice = await this.invoicesRepository.findByIdScoped(
      invoiceId,
      organizationId
    );
    if (!invoice) {
      throw new NotFoundException("Invoice not found");
    }
    if (invoice.approvalStatus !== InvoiceApprovalStatus.APPROVED) {
      throw new BadRequestException("Only approved invoices can be exported");
    }

    const updated = await this.invoicesRepository.update(invoiceId, {
      accountingExportStatus: AccountingExportStatus.EXPORT_REQUESTED
    });
    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "invoice.export_requested",
      entityType: "Invoice",
      entityId: invoiceId,
      oldValues: { accountingExportStatus: invoice.accountingExportStatus },
      newValues: { accountingExportStatus: updated.accountingExportStatus },
      metadata: { requestId, mode: dto.mode ?? "manual" }
    });
    return InvoiceMapper.toResponse(updated);
  }
}


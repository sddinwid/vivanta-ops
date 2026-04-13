import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InvoiceApprovalStatus } from "@prisma/client";
import { AuditService } from "../../audit/services/audit.service";
import { RejectInvoiceDto } from "../dto/reject-invoice.dto";
import { SubmitInvoiceForReviewDto } from "../dto/submit-invoice-for-review.dto";
import { InvoiceMapper } from "../mappers/invoice.mapper";
import { InvoicesRepository } from "../repositories/invoices.repository";

@Injectable()
export class InvoiceReviewService {
  constructor(
    private readonly invoicesRepository: InvoicesRepository,
    private readonly auditService: AuditService
  ) {}

  async submitForReview(params: {
    organizationId: string;
    actorUserId: string;
    invoiceId: string;
    dto: SubmitInvoiceForReviewDto;
    requestId?: string;
  }) {
    const { organizationId, actorUserId, invoiceId, dto, requestId } = params;
    const existing = await this.invoicesRepository.findByIdScoped(
      invoiceId,
      organizationId
    );
    if (!existing) {
      throw new NotFoundException("Invoice not found");
    }
    if (
      ![
        InvoiceApprovalStatus.DRAFT,
        InvoiceApprovalStatus.REJECTED,
        InvoiceApprovalStatus.CHANGES_REQUESTED
      ].includes(existing.approvalStatus)
    ) {
      throw new BadRequestException(
        `Cannot submit invoice for review from ${existing.approvalStatus}`
      );
    }

    const updated = await this.invoicesRepository.update(invoiceId, {
      approvalStatus: InvoiceApprovalStatus.PENDING_REVIEW
    });
    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "invoice.submit_for_review",
      entityType: "Invoice",
      entityId: invoiceId,
      oldValues: { approvalStatus: existing.approvalStatus },
      newValues: { approvalStatus: updated.approvalStatus },
      metadata: { requestId, note: dto.note }
    });
    return InvoiceMapper.toResponse(updated);
  }

  async reject(params: {
    organizationId: string;
    actorUserId: string;
    invoiceId: string;
    dto: RejectInvoiceDto;
    requestId?: string;
  }) {
    const { organizationId, actorUserId, invoiceId, dto, requestId } = params;
    const existing = await this.invoicesRepository.findByIdScoped(
      invoiceId,
      organizationId
    );
    if (!existing) {
      throw new NotFoundException("Invoice not found");
    }

    const updated = await this.invoicesRepository.update(invoiceId, {
      approvalStatus: InvoiceApprovalStatus.REJECTED,
      duplicateCheckStatus: dto.duplicateCheckStatus ?? existing.duplicateCheckStatus
    });

    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "invoice.reject",
      entityType: "Invoice",
      entityId: invoiceId,
      oldValues: { approvalStatus: existing.approvalStatus },
      newValues: {
        approvalStatus: updated.approvalStatus,
        duplicateCheckStatus: updated.duplicateCheckStatus
      },
      metadata: { requestId, reason: dto.reason }
    });
    return InvoiceMapper.toResponse(updated);
  }
}


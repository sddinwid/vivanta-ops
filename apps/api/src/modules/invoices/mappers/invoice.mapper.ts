import { Injectable } from "@nestjs/common";
import { Invoice, InvoiceLine } from "@prisma/client";

@Injectable()
export class InvoiceMapper {
  static toResponse(
    invoice: Invoice & {
      lines?: InvoiceLine[];
    }
  ) {
    return {
      id: invoice.id,
      organizationId: invoice.organizationId,
      propertyId: invoice.propertyId,
      vendorId: invoice.vendorId,
      sourceDocumentId: invoice.sourceDocumentId,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      currencyCode: invoice.currencyCode,
      subtotalAmount: invoice.subtotalAmount,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.totalAmount,
      extractionConfidence: invoice.extractionConfidence,
      duplicateCheckStatus: invoice.duplicateCheckStatus,
      approvalStatus: invoice.approvalStatus,
      accountingExportStatus: invoice.accountingExportStatus,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      lines:
        invoice.lines?.map((line) => ({
          id: line.id,
          lineNumber: line.lineNumber,
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal: line.lineTotal,
          taxRate: line.taxRate,
          createdAt: line.createdAt
        })) ?? []
    };
  }
}


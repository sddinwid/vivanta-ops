import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { InvoiceApprovalStatus, Prisma } from "@prisma/client";
import { AuditService } from "../../audit/services/audit.service";
import { CreateInvoiceDto } from "../dto/create-invoice.dto";
import { CreateInvoiceLineDto } from "../dto/create-invoice-line.dto";
import { InvoiceFiltersDto } from "../dto/invoice-filters.dto";
import { UpdateInvoiceDto } from "../dto/update-invoice.dto";
import { InvoiceMapper } from "../mappers/invoice.mapper";
import { InvoiceLinesRepository } from "../repositories/invoice-lines.repository";
import { InvoicesRepository } from "../repositories/invoices.repository";

@Injectable()
export class InvoicesService {
  constructor(
    private readonly invoicesRepository: InvoicesRepository,
    private readonly invoiceLinesRepository: InvoiceLinesRepository,
    private readonly auditService: AuditService
  ) {}

  async list(organizationId: string, filters: InvoiceFiltersDto) {
    const [data, total] = await Promise.all([
      this.invoicesRepository.listByOrganization(organizationId, filters),
      this.invoicesRepository.countByOrganization(organizationId, filters)
    ]);
    return {
      data: data.map(InvoiceMapper.toResponse),
      meta: { total, limit: filters.limit ?? 25, offset: filters.offset ?? 0 }
    };
  }

  async create(params: {
    organizationId: string;
    actorUserId: string;
    dto: CreateInvoiceDto;
    requestId?: string;
  }) {
    const { organizationId, actorUserId, dto, requestId } = params;
    await this.validateReferences(organizationId, dto.propertyId, dto.vendorId, dto.sourceDocumentId);
    this.validateLineNumbers(dto.lines);

    try {
      const invoice = await this.invoicesRepository.create({
        organization: { connect: { id: organizationId } },
        property: dto.propertyId ? { connect: { id: dto.propertyId } } : undefined,
        vendor: dto.vendorId ? { connect: { id: dto.vendorId } } : undefined,
        sourceDocument: dto.sourceDocumentId
          ? { connect: { id: dto.sourceDocumentId } }
          : undefined,
        invoiceNumber: dto.invoiceNumber,
        invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        currencyCode: dto.currencyCode.toUpperCase(),
        subtotalAmount: dto.subtotalAmount,
        taxAmount: dto.taxAmount,
        totalAmount: dto.totalAmount,
        extractionConfidence: dto.extractionConfidence,
        duplicateCheckStatus: dto.duplicateCheckStatus,
        approvalStatus: InvoiceApprovalStatus.DRAFT
      });

      if (dto.lines && dto.lines.length > 0) {
        await this.invoiceLinesRepository.createMany(invoice.id, dto.lines);
      }

      const withLines = await this.invoicesRepository.findByIdScoped(
        invoice.id,
        organizationId
      );
      if (!withLines) {
        throw new NotFoundException("Invoice not found after create");
      }

      await this.auditService.record({
        organizationId,
        actorUserId,
        actionType: "invoice.create",
        entityType: "Invoice",
        entityId: invoice.id,
        newValues: InvoiceMapper.toResponse(withLines),
        metadata: { requestId }
      });
      return InvoiceMapper.toResponse(withLines);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new BadRequestException(
          "Duplicate invoice constraint violated (vendor/invoiceNumber or lineNumber)"
        );
      }
      throw error;
    }
  }

  async getById(organizationId: string, invoiceId: string) {
    const invoice = await this.invoicesRepository.findByIdScoped(
      invoiceId,
      organizationId
    );
    if (!invoice) {
      throw new NotFoundException("Invoice not found");
    }
    return InvoiceMapper.toResponse(invoice);
  }

  async update(params: {
    organizationId: string;
    actorUserId: string;
    invoiceId: string;
    dto: UpdateInvoiceDto;
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

    try {
      const updated = await this.invoicesRepository.update(invoiceId, {
        invoiceNumber: dto.invoiceNumber,
        invoiceDate: dto.invoiceDate
          ? new Date(dto.invoiceDate)
          : dto.invoiceDate === null
            ? null
            : undefined,
        dueDate: dto.dueDate
          ? new Date(dto.dueDate)
          : dto.dueDate === null
            ? null
            : undefined,
        currencyCode: dto.currencyCode?.toUpperCase(),
        subtotalAmount: dto.subtotalAmount,
        taxAmount: dto.taxAmount,
        totalAmount: dto.totalAmount,
        extractionConfidence: dto.extractionConfidence,
        duplicateCheckStatus: dto.duplicateCheckStatus
      });

      await this.auditService.record({
        organizationId,
        actorUserId,
        actionType: "invoice.update",
        entityType: "Invoice",
        entityId: invoiceId,
        oldValues: InvoiceMapper.toResponse(existing),
        newValues: InvoiceMapper.toResponse(updated),
        metadata: { requestId }
      });
      return InvoiceMapper.toResponse(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new BadRequestException(
          "Duplicate invoice constraint violated (vendor/invoiceNumber)"
        );
      }
      throw error;
    }
  }

  async listLines(organizationId: string, invoiceId: string) {
    await this.requireInvoice(invoiceId, organizationId);
    const lines = await this.invoiceLinesRepository.listByInvoice(invoiceId);
    return { data: lines, meta: { total: lines.length } };
  }

  async createLine(params: {
    organizationId: string;
    actorUserId: string;
    invoiceId: string;
    dto: CreateInvoiceLineDto;
    requestId?: string;
  }) {
    const { organizationId, actorUserId, invoiceId, dto, requestId } = params;
    await this.requireInvoice(invoiceId, organizationId);
    try {
      const line = await this.invoiceLinesRepository.create({
        invoice: { connect: { id: invoiceId } },
        lineNumber: dto.lineNumber,
        description: dto.description,
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
        lineTotal: dto.lineTotal,
        taxRate: dto.taxRate
      });
      await this.auditService.record({
        organizationId,
        actorUserId,
        actionType: "invoice.line.add",
        entityType: "InvoiceLine",
        entityId: line.id,
        newValues: line,
        metadata: { requestId, invoiceId }
      });
      return line;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new BadRequestException("Duplicate lineNumber for this invoice");
      }
      throw error;
    }
  }

  async queuePendingReview(organizationId: string) {
    const data = await this.invoicesRepository.queueByStatus(
      organizationId,
      InvoiceApprovalStatus.PENDING_REVIEW
    );
    return { data: data.map(InvoiceMapper.toResponse), meta: { total: data.length } };
  }

  async queuePendingApproval(organizationId: string) {
    const data = await this.invoicesRepository.queueByStatus(
      organizationId,
      InvoiceApprovalStatus.PENDING_APPROVAL
    );
    return { data: data.map(InvoiceMapper.toResponse), meta: { total: data.length } };
  }

  async queueExceptions(organizationId: string) {
    const data = await this.invoicesRepository.queueExceptions(organizationId);
    return { data: data.map(InvoiceMapper.toResponse), meta: { total: data.length } };
  }

  private async validateReferences(
    organizationId: string,
    propertyId?: string,
    vendorId?: string,
    sourceDocumentId?: string
  ): Promise<void> {
    if (propertyId) {
      const property = await this.invoicesRepository.findPropertyInOrganization(
        propertyId,
        organizationId
      );
      if (!property) {
        throw new BadRequestException("propertyId must belong to organization");
      }
    }
    if (vendorId) {
      const vendor = await this.invoicesRepository.findVendorInOrganization(
        vendorId,
        organizationId
      );
      if (!vendor) {
        throw new BadRequestException("vendorId must belong to organization");
      }
    }
    if (sourceDocumentId) {
      const document = await this.invoicesRepository.findDocumentInOrganization(
        sourceDocumentId,
        organizationId
      );
      if (!document) {
        throw new BadRequestException("sourceDocumentId must belong to organization");
      }
    }
  }

  private validateLineNumbers(lines?: CreateInvoiceLineDto[]): void {
    if (!lines || lines.length === 0) {
      return;
    }
    const lineNumbers = lines.map((line) => line.lineNumber);
    if (new Set(lineNumbers).size !== lineNumbers.length) {
      throw new BadRequestException("Duplicate lineNumber values in invoice lines");
    }
  }

  private async requireInvoice(invoiceId: string, organizationId: string): Promise<void> {
    const invoice = await this.invoicesRepository.findByIdScoped(
      invoiceId,
      organizationId
    );
    if (!invoice) {
      throw new NotFoundException("Invoice not found");
    }
  }
}


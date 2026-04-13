import { Injectable } from "@nestjs/common";
import {
  Invoice,
  InvoiceApprovalStatus,
  Prisma
} from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";
import { InvoiceFiltersDto } from "../dto/invoice-filters.dto";

@Injectable()
export class InvoicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByOrganization(organizationId: string, filters: InvoiceFiltersDto) {
    return this.prisma.invoice.findMany({
      where: {
        organizationId,
        propertyId: filters.propertyId,
        vendorId: filters.vendorId,
        sourceDocumentId: filters.sourceDocumentId,
        approvalStatus: filters.approvalStatus,
        accountingExportStatus: filters.accountingExportStatus,
        invoiceDate:
          filters.invoiceDateFrom || filters.invoiceDateTo
            ? {
                gte: filters.invoiceDateFrom
                  ? new Date(filters.invoiceDateFrom)
                  : undefined,
                lte: filters.invoiceDateTo
                  ? new Date(filters.invoiceDateTo)
                  : undefined
              }
            : undefined,
        dueDate:
          filters.dueDateFrom || filters.dueDateTo
            ? {
                gte: filters.dueDateFrom ? new Date(filters.dueDateFrom) : undefined,
                lte: filters.dueDateTo ? new Date(filters.dueDateTo) : undefined
              }
            : undefined
      },
      include: { lines: true },
      orderBy: { updatedAt: "desc" },
      skip: filters.offset,
      take: filters.limit
    });
  }

  countByOrganization(organizationId: string, filters: InvoiceFiltersDto): Promise<number> {
    return this.prisma.invoice.count({
      where: {
        organizationId,
        propertyId: filters.propertyId,
        vendorId: filters.vendorId,
        sourceDocumentId: filters.sourceDocumentId,
        approvalStatus: filters.approvalStatus,
        accountingExportStatus: filters.accountingExportStatus,
        invoiceDate:
          filters.invoiceDateFrom || filters.invoiceDateTo
            ? {
                gte: filters.invoiceDateFrom
                  ? new Date(filters.invoiceDateFrom)
                  : undefined,
                lte: filters.invoiceDateTo
                  ? new Date(filters.invoiceDateTo)
                  : undefined
              }
            : undefined,
        dueDate:
          filters.dueDateFrom || filters.dueDateTo
            ? {
                gte: filters.dueDateFrom ? new Date(filters.dueDateFrom) : undefined,
                lte: filters.dueDateTo ? new Date(filters.dueDateTo) : undefined
              }
            : undefined
      }
    });
  }

  findByIdScoped(invoiceId: string, organizationId: string) {
    return this.prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId },
      include: { lines: true }
    });
  }

  create(data: Prisma.InvoiceCreateInput): Promise<Invoice> {
    return this.prisma.invoice.create({ data });
  }

  update(invoiceId: string, data: Prisma.InvoiceUpdateInput): Promise<Invoice> {
    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data
    });
  }

  findPropertyInOrganization(propertyId: string, organizationId: string) {
    return this.prisma.property.findFirst({
      where: { id: propertyId, organizationId },
      select: { id: true }
    });
  }

  findVendorInOrganization(vendorId: string, organizationId: string) {
    return this.prisma.vendor.findFirst({
      where: { id: vendorId, organizationId },
      select: { id: true }
    });
  }

  findDocumentInOrganization(sourceDocumentId: string, organizationId: string) {
    return this.prisma.document.findFirst({
      where: { id: sourceDocumentId, organizationId },
      select: { id: true }
    });
  }

  queueByStatus(organizationId: string, status: InvoiceApprovalStatus) {
    return this.prisma.invoice.findMany({
      where: { organizationId, approvalStatus: status },
      include: { lines: true },
      orderBy: { updatedAt: "desc" },
      take: 100
    });
  }

  queueExceptions(organizationId: string) {
    return this.prisma.invoice.findMany({
      where: {
        organizationId,
        OR: [
          { approvalStatus: InvoiceApprovalStatus.REJECTED },
          { duplicateCheckStatus: { in: ["suspected_duplicate", "invalid"] } }
        ]
      },
      include: { lines: true },
      orderBy: { updatedAt: "desc" },
      take: 100
    });
  }

  listUsersByRoleNames(organizationId: string, roleNames: string[]) {
    return this.prisma.userRoleAssignment.findMany({
      where: {
        role: {
          organizationId,
          roleName: { in: roleNames }
        }
      },
      select: { userId: true }
    });
  }

  listUsersInOrganization(organizationId: string, userIds: string[]) {
    return this.prisma.user.findMany({
      where: { organizationId, id: { in: userIds } },
      select: { id: true }
    });
  }
}

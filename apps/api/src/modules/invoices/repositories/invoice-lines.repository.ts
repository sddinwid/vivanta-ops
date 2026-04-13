import { Injectable } from "@nestjs/common";
import { InvoiceLine, Prisma } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";

@Injectable()
export class InvoiceLinesRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByInvoice(invoiceId: string): Promise<InvoiceLine[]> {
    return this.prisma.invoiceLine.findMany({
      where: { invoiceId },
      orderBy: { lineNumber: "asc" }
    });
  }

  create(data: Prisma.InvoiceLineCreateInput): Promise<InvoiceLine> {
    return this.prisma.invoiceLine.create({ data });
  }

  async createMany(
    invoiceId: string,
    lines: Array<{
      lineNumber: number;
      description?: string;
      quantity?: Prisma.Decimal | number;
      unitPrice?: Prisma.Decimal | number;
      lineTotal?: Prisma.Decimal | number;
      taxRate?: Prisma.Decimal | number;
    }>
  ): Promise<void> {
    if (lines.length === 0) {
      return;
    }
    await this.prisma.invoiceLine.createMany({
      data: lines.map((line) => ({
        invoiceId,
        lineNumber: line.lineNumber,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
        taxRate: line.taxRate
      }))
    });
  }
}

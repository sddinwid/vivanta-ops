import { Module } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { PrismaModule } from "../../database/prisma/prisma.module";
import { AuditModule } from "../audit/audit.module";
import { ApprovalsModule } from "../approvals/approvals.module";
import { InvoicesController } from "./controllers/invoices.controller";
import { InvoiceMapper } from "./mappers/invoice.mapper";
import { InvoiceLinesRepository } from "./repositories/invoice-lines.repository";
import { InvoicesRepository } from "./repositories/invoices.repository";
import { InvoiceApprovalService } from "./services/invoice-approval.service";
import { InvoiceReviewService } from "./services/invoice-review.service";
import { InvoicesService } from "./services/invoices.service";

@Module({
  imports: [PrismaModule, AuditModule, ApprovalsModule],
  controllers: [InvoicesController],
  providers: [
    InvoicesService,
    InvoiceReviewService,
    InvoiceApprovalService,
    InvoicesRepository,
    InvoiceLinesRepository,
    InvoiceMapper,
    JwtAuthGuard,
    PermissionsGuard
  ]
})
export class InvoicesModule {}

import { Transform, Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min
} from "class-validator";
import { AccountingExportStatus, InvoiceApprovalStatus } from "@prisma/client";

export class InvoiceFiltersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @IsUUID("4")
  propertyId?: string;

  @IsOptional()
  @IsUUID("4")
  vendorId?: string;

  @IsOptional()
  @IsUUID("4")
  sourceDocumentId?: string;

  @IsOptional()
  @IsEnum(InvoiceApprovalStatus)
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value
  )
  approvalStatus?: InvoiceApprovalStatus;

  @IsOptional()
  @IsEnum(AccountingExportStatus)
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value
  )
  accountingExportStatus?: AccountingExportStatus;

  @IsOptional()
  @IsDateString()
  invoiceDateFrom?: string;

  @IsOptional()
  @IsDateString()
  invoiceDateTo?: string;

  @IsOptional()
  @IsDateString()
  dueDateFrom?: string;

  @IsOptional()
  @IsDateString()
  dueDateTo?: string;
}


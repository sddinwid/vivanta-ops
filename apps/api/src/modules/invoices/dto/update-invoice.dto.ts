import { Type } from "class-transformer";
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Length
} from "class-validator";

export class UpdateInvoiceDto {
  @IsOptional()
  @IsString()
  invoiceNumber?: string | null;

  @IsOptional()
  @IsDateString()
  invoiceDate?: string | null;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @IsOptional()
  @Length(3, 3)
  currencyCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  subtotalAmount?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  taxAmount?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalAmount?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  extractionConfidence?: number | null;

  @IsOptional()
  @IsString()
  duplicateCheckStatus?: string | null;
}


import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested
} from "class-validator";
import { CreateInvoiceLineDto } from "./create-invoice-line.dto";

export class CreateInvoiceDto {
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
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @Length(3, 3)
  currencyCode!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  subtotalAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  taxAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  extractionConfidence?: number;

  @IsOptional()
  @IsString()
  duplicateCheckStatus?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceLineDto)
  lines?: CreateInvoiceLineDto[];
}


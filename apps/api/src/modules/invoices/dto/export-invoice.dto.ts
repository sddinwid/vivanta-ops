import { IsOptional, IsString, MaxLength } from "class-validator";

export class ExportInvoiceDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  mode?: string;
}


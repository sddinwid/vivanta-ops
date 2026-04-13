import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class RejectInvoiceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(300)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  duplicateCheckStatus?: string;
}


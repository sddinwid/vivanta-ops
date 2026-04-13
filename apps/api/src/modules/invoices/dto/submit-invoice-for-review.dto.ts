import { IsOptional, IsString, MaxLength } from "class-validator";

export class SubmitInvoiceForReviewDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}


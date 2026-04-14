import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class ApplyInvoiceRoutingSuggestionDto {
  @IsUUID("4")
  suggestionId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}


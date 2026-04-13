import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  documentType?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sourceType?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sourceReference?: string | null;
}


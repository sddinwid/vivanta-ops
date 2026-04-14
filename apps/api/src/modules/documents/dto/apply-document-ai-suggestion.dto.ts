import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class ApplyDocumentAiSuggestionDto {
  @IsUUID("4")
  suggestionId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}


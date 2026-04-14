import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class ApplyCaseAiSuggestionDto {
  @IsUUID("4")
  suggestionId!: string;

  @IsOptional()
  @IsBoolean()
  applyCaseType?: boolean;

  @IsOptional()
  @IsBoolean()
  applyPriority?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}


import { IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class ApplyAiSuggestionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsObject()
  applicationMetadata?: Record<string, unknown>;
}

import { Transform } from "class-transformer";
import { AiCapability, AiSuggestionType } from "@prisma/client";
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateAiRunDto {
  @IsEnum(AiCapability)
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
  capability!: AiCapability;

  @IsOptional()
  @IsUUID("4")
  promptTemplateId?: string;

  @IsOptional()
  @IsString()
  targetEntityType?: string;

  @IsOptional()
  @IsUUID("4")
  targetEntityId?: string;

  @IsOptional()
  @IsObject()
  inputJson?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  createSuggestions?: boolean;

  @IsOptional()
  @IsEnum(AiSuggestionType)
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
  suggestionType?: AiSuggestionType;
}

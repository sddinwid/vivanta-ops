import { Transform } from "class-transformer";
import { AiCapability } from "@prisma/client";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class UpdatePromptTemplateDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  templateKey?: string;

  @IsOptional()
  @IsEnum(AiCapability)
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
  capability?: AiCapability;

  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsOptional()
  @IsString()
  userPromptTemplate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

import { Transform } from "class-transformer";
import { AiCapability } from "@prisma/client";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreatePromptTemplateDto {
  @IsString()
  @MaxLength(120)
  templateKey!: string;

  @IsEnum(AiCapability)
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
  capability!: AiCapability;

  @IsInt()
  @Min(1)
  version!: number;

  @IsString()
  systemPrompt!: string;

  @IsString()
  userPromptTemplate!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

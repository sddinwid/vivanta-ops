import { Transform } from "class-transformer";
import { IsEnum, IsNumber, IsObject, IsOptional, IsString, MaxLength } from "class-validator";
import { AiEvaluationOutcome } from "@prisma/client";

export class CreateAiEvaluationDto {
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
  @IsEnum(AiEvaluationOutcome)
  outcome!: AiEvaluationOutcome;

  @IsOptional()
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  notes?: string;

  @IsOptional()
  @IsObject()
  metadataJson?: Record<string, unknown>;
}


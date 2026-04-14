import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { AiCapability } from "@prisma/client";

export class AiRunSummaryFiltersDto {
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value
  )
  @IsEnum(AiCapability)
  capability?: AiCapability;

  @IsOptional()
  @IsString()
  createdFrom?: string;

  @IsOptional()
  @IsString()
  createdTo?: string;
}


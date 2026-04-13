import { Transform, Type } from "class-transformer";
import { AiCapability, AiRunStatus } from "@prisma/client";
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class AiRunFiltersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @IsEnum(AiCapability)
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
  capability?: AiCapability;

  @IsOptional()
  @IsEnum(AiRunStatus)
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
  status?: AiRunStatus;

  @IsOptional()
  @IsString()
  targetEntityType?: string;

  @IsOptional()
  @IsUUID("4")
  targetEntityId?: string;

  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @IsOptional()
  @IsDateString()
  createdTo?: string;
}

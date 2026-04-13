import { Transform, Type } from "class-transformer";
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { OperationalPriority } from "@prisma/client";

export class PortalCaseFiltersDto {
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
  @IsString()
  ownerVisibleStatus?: string;

  @IsOptional()
  @IsEnum(OperationalPriority)
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
  priority?: OperationalPriority;

  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @IsOptional()
  @IsDateString()
  createdTo?: string;
}

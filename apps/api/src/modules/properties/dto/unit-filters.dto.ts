import { Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min
} from "class-validator";
import { OccupancyStatus } from "@prisma/client";

export class UnitFiltersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @IsEnum(OccupancyStatus)
  occupancyStatus?: OccupancyStatus;

  @IsOptional()
  @IsUUID("4")
  buildingId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  search?: string;
}


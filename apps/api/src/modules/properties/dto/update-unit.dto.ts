import { Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min
} from "class-validator";
import { OccupancyStatus } from "@prisma/client";

export class UpdateUnitDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  unitNumber?: string;

  @IsOptional()
  @IsUUID("4")
  buildingId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  floorLabel?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  unitType?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  squareMeters?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedroomCount?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bathroomCount?: number | null;

  @IsOptional()
  @IsEnum(OccupancyStatus)
  occupancyStatus?: OccupancyStatus;
}

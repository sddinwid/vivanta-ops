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

export class CreateUnitDto {
  @IsString()
  @MaxLength(40)
  unitNumber!: string;

  @IsOptional()
  @IsUUID("4")
  buildingId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  floorLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  unitType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  squareMeters?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedroomCount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bathroomCount?: number;

  @IsOptional()
  @IsEnum(OccupancyStatus)
  occupancyStatus?: OccupancyStatus;
}

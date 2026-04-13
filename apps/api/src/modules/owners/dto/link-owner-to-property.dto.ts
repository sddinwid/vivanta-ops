import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  Max,
  Min
} from "class-validator";

export class LinkOwnerToPropertyDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  ownershipPercentage?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isPrimaryContact?: boolean;
}


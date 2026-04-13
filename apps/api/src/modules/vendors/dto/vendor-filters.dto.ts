import { Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min
} from "class-validator";
import { UserStatus } from "@prisma/client";

export class VendorFiltersDto {
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
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  tradeCategory?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}


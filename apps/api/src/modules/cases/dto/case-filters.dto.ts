import { Transform, Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min
} from "class-validator";
import { CaseStatus, OperationalPriority } from "@prisma/client";

export class CaseFiltersDto {
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
  @IsEnum(CaseStatus)
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value
  )
  status?: CaseStatus;

  @IsOptional()
  @IsEnum(OperationalPriority)
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value
  )
  priority?: OperationalPriority;

  @IsOptional()
  @IsUUID("4")
  assignedUserId?: string;

  @IsOptional()
  @IsUUID("4")
  propertyId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @IsOptional()
  @IsDateString()
  createdTo?: string;
}


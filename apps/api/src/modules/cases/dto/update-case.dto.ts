import { Transform } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength
} from "class-validator";
import { CaseStatus, OperationalPriority } from "@prisma/client";

export class UpdateCaseDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

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
  propertyId?: string | null;

  @IsOptional()
  @IsUUID("4")
  unitId?: string | null;

  @IsOptional()
  @IsDateString()
  dueAt?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  ownerVisibleStatus?: string | null;
}


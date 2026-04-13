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

export class CreateCaseDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  caseType!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

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
  propertyId?: string;

  @IsOptional()
  @IsUUID("4")
  unitId?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsUUID("4")
  assignedUserId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  ownerVisibleStatus?: string;
}


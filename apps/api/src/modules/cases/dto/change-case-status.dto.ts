import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { CaseStatus } from "@prisma/client";

export class ChangeCaseStatusDto {
  @IsEnum(CaseStatus)
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value
  )
  status!: CaseStatus;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  ownerVisibleStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}


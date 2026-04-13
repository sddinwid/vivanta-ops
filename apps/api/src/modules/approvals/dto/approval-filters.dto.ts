import { Transform, Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min
} from "class-validator";
import { ApprovalFlowStatus, ApprovalTargetEntityType } from "@prisma/client";

export class ApprovalFiltersDto {
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
  @IsEnum(ApprovalTargetEntityType)
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value
  )
  targetEntityType?: ApprovalTargetEntityType;

  @IsOptional()
  @IsString()
  targetEntityId?: string;

  @IsOptional()
  @IsEnum(ApprovalFlowStatus)
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value
  )
  status?: ApprovalFlowStatus;
}


import { Transform } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength
} from "class-validator";
import { ApprovalTargetEntityType } from "@prisma/client";

export class CreateApprovalFlowDto {
  @IsEnum(ApprovalTargetEntityType)
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value
  )
  targetEntityType!: ApprovalTargetEntityType;

  @IsString()
  @MaxLength(120)
  targetEntityId!: string;

  @IsString()
  @MaxLength(80)
  flowType!: string;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  approverUserIds?: string[];
}


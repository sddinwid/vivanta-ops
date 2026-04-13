import { Transform } from "class-transformer";
import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";
import { WorkOrderStatus } from "@prisma/client";

export class UpdateWorkOrderDto {
  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsEnum(WorkOrderStatus)
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value
  )
  status?: WorkOrderStatus;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string | null;

  @IsOptional()
  @IsDateString()
  slaDueAt?: string | null;
}


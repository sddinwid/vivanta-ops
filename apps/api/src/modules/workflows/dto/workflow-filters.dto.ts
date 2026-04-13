import { Transform, Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";
import { WorkflowOrchestrationProvider, WorkflowStatus } from "@prisma/client";

export class WorkflowFiltersDto {
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
  @IsString()
  workflowType?: string;

  @IsOptional()
  @IsEnum(WorkflowStatus)
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
  status?: WorkflowStatus;

  @IsOptional()
  @IsString()
  targetEntityType?: string;

  @IsOptional()
  @IsUUID("4")
  targetEntityId?: string;

  @IsOptional()
  @IsEnum(WorkflowOrchestrationProvider)
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
  orchestrationProvider?: WorkflowOrchestrationProvider;
}

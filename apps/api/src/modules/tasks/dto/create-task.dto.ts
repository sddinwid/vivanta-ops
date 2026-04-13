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
import { OperationalPriority, TaskStatus } from "@prisma/client";

export class CreateTaskDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  taskType!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value
  )
  status?: TaskStatus;

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
  @IsString()
  @MaxLength(60)
  relatedEntityType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  relatedEntityId?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;
}


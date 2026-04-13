import { Transform } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength
} from "class-validator";
import { OperationalPriority, TaskStatus } from "@prisma/client";

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

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
  @IsString()
  @MaxLength(60)
  relatedEntityType?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  relatedEntityId?: string | null;

  @IsOptional()
  @IsDateString()
  dueAt?: string | null;
}


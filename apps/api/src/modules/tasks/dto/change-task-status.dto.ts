import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { TaskStatus } from "@prisma/client";

export class ChangeTaskStatusDto {
  @IsEnum(TaskStatus)
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value
  )
  status!: TaskStatus;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}


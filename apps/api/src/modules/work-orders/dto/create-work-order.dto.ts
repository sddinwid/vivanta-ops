import { IsDateString, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateWorkOrderDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  workOrderNumber?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @IsOptional()
  @IsDateString()
  slaDueAt?: string;
}


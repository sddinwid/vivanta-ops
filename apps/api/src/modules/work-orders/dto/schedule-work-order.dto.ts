import { IsDateString, IsOptional } from "class-validator";

export class ScheduleWorkOrderDto {
  @IsDateString()
  scheduledFor!: string;

  @IsOptional()
  @IsDateString()
  slaDueAt?: string;
}


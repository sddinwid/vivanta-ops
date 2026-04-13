import { IsOptional, IsString, MaxLength } from "class-validator";

export class RetryWorkflowDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

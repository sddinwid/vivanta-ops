import { IsOptional, IsString, MaxLength } from "class-validator";

export class CancelWorkflowDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

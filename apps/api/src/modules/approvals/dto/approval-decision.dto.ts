import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class ApprovalDecisionDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(300)
  reason?: string;
}


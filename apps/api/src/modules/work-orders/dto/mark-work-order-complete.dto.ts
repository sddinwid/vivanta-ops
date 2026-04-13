import { IsOptional, IsString, MaxLength } from "class-validator";

export class MarkWorkOrderCompleteDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}


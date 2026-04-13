import { IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class AppendWorkflowEventDto {
  @IsString()
  @MaxLength(120)
  eventType!: string;

  @IsOptional()
  @IsObject()
  eventPayload?: Record<string, unknown>;
}

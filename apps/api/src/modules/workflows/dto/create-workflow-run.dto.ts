import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateWorkflowRunDto {
  @IsString()
  @MaxLength(120)
  workflowType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  targetEntityType?: string;

  @IsOptional()
  @IsUUID("4")
  targetEntityId?: string;
}

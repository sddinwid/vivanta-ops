import { ValidateIf, IsUUID } from "class-validator";

export class AssignCaseDto {
  @ValidateIf((_, value) => value !== null)
  @IsUUID("4")
  assignedUserId!: string | null;
}


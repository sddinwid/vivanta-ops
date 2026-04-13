import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class AuditFiltersDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  entityType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  entityId?: string;

  @IsOptional()
  @IsUUID("4")
  actorUserId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  actionType?: string;
}


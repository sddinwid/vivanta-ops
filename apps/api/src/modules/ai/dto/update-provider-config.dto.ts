import { Transform } from "class-transformer";
import { AiCapability } from "@prisma/client";
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class UpdateProviderConfigDto {
  @IsOptional()
  @IsUUID("4")
  organizationId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  providerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  modelName?: string;

  @IsOptional()
  @IsEnum(AiCapability)
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
  capability?: AiCapability;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsObject()
  settingsJson?: Record<string, unknown>;
}

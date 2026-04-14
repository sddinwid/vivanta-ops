import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { AiSuggestionType } from "@prisma/client";

export class AiSuggestionFiltersDto {
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value
  )
  @IsEnum(AiSuggestionType)
  suggestionType?: AiSuggestionType;

  @IsOptional()
  @Transform(({ value }) => (value === "true" ? true : value === "false" ? false : value))
  @IsBoolean()
  isApplied?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  targetEntityType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  targetEntityId?: string;

  @IsOptional()
  @IsString()
  createdFrom?: string;

  @IsOptional()
  @IsString()
  createdTo?: string;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : value))
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : value))
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}


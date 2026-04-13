import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min
} from "class-validator";
import {
  DocumentIngestionStatus,
  DocumentLinkedEntityType
} from "@prisma/client";

export class DocumentFiltersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  documentType?: string;

  @IsOptional()
  @IsEnum(DocumentIngestionStatus)
  ingestionStatus?: DocumentIngestionStatus;

  @IsOptional()
  @IsUUID("4")
  uploadedByUserId?: string;

  @IsOptional()
  @IsEnum(DocumentLinkedEntityType)
  linkedEntityType?: DocumentLinkedEntityType;

  @IsOptional()
  @IsUUID("4")
  linkedEntityId?: string;

  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}


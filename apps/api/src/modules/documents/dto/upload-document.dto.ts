import { Transform } from "class-transformer";
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength
} from "class-validator";
import { DocumentLinkedEntityType } from "@prisma/client";

export class UploadDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  documentType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sourceType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sourceReference?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value
  )
  @IsEnum(DocumentLinkedEntityType)
  linkedEntityType?: DocumentLinkedEntityType;

  @IsOptional()
  @IsUUID("4")
  linkedEntityId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  linkRole?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  attachmentContextType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  attachmentContextId?: string;
}

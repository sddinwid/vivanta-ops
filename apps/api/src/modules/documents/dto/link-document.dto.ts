import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { DocumentLinkedEntityType } from "@prisma/client";

export class LinkDocumentDto {
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value
  )
  @IsEnum(DocumentLinkedEntityType)
  linkedEntityType!: DocumentLinkedEntityType;

  @IsUUID("4")
  linkedEntityId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  linkRole?: string;
}

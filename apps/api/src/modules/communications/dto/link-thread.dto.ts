import { Transform } from "class-transformer";
import { IsEnum, IsUUID } from "class-validator";
import { DocumentLinkedEntityType } from "@prisma/client";

export class LinkThreadDto {
  @IsEnum(DocumentLinkedEntityType)
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value
  )
  linkedEntityType!: DocumentLinkedEntityType;

  @IsUUID("4")
  linkedEntityId!: string;
}


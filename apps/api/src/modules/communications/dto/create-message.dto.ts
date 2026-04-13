import { Transform } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID
} from "class-validator";
import { MessageDirection } from "@prisma/client";

export class CreateMessageDto {
  @IsOptional()
  @IsEnum(MessageDirection)
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value
  )
  direction?: MessageDirection;

  @IsOptional()
  @IsString()
  senderType?: string;

  @IsOptional()
  @IsString()
  senderReferenceId?: string;

  @IsOptional()
  @IsString()
  bodyText?: string;

  @IsOptional()
  @IsString()
  bodyHtml?: string;

  @IsOptional()
  @IsString()
  messageStatus?: string;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  documentIds?: string[];
}


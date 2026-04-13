import { Type, Transform } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested
} from "class-validator";
import {
  CommunicationChannelType,
  CommunicationPriority,
  CommunicationThreadStatus,
  DocumentLinkedEntityType,
  MessageDirection
} from "@prisma/client";

class InitialMessageDto {
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
  @IsArray()
  @IsUUID("4", { each: true })
  documentIds?: string[];
}

export class CreateThreadDto {
  @IsEnum(CommunicationChannelType)
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value
  )
  channelType!: CommunicationChannelType;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsOptional()
  @IsEnum(CommunicationThreadStatus)
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value
  )
  status?: CommunicationThreadStatus;

  @IsOptional()
  @IsEnum(CommunicationPriority)
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value
  )
  priority?: CommunicationPriority;

  @IsOptional()
  @IsEnum(DocumentLinkedEntityType)
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value
  )
  linkedEntityType?: DocumentLinkedEntityType;

  @IsOptional()
  @IsUUID("4")
  linkedEntityId?: string;

  @IsOptional()
  @IsUUID("4")
  assignedUserId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => InitialMessageDto)
  initialMessage?: InitialMessageDto;
}


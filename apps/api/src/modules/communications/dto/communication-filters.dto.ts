import { Transform, Type } from "class-transformer";
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
  CommunicationChannelType,
  CommunicationPriority,
  CommunicationThreadStatus,
  DocumentLinkedEntityType
} from "@prisma/client";

export class CommunicationFiltersDto {
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
  @IsEnum(CommunicationChannelType)
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value
  )
  channelType?: CommunicationChannelType;

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
  @IsUUID("4")
  assignedUserId?: string;

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
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @IsOptional()
  @IsDateString()
  createdTo?: string;
}


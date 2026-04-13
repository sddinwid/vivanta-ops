import { Transform } from "class-transformer";
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength
} from "class-validator";
import {
  CommunicationPriority,
  CommunicationThreadStatus
} from "@prisma/client";

export class UpdateThreadDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string | null;

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
}


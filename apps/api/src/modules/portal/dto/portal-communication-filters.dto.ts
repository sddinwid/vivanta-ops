import { Transform, Type } from "class-transformer";
import { CommunicationChannelType, CommunicationThreadStatus } from "@prisma/client";
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";

export class PortalCommunicationFiltersDto {
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
  @IsUUID("4")
  propertyId?: string;

  @IsOptional()
  @IsEnum(CommunicationThreadStatus)
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
  status?: CommunicationThreadStatus;

  @IsOptional()
  @IsEnum(CommunicationChannelType)
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
  channelType?: CommunicationChannelType;
}

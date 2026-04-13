import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  MinLength
} from "class-validator";
import { PropertyStatus, PropertyType } from "@prisma/client";

export class CreatePropertyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  propertyCode!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  street?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string;

  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @IsEnum(PropertyType)
  propertyType!: PropertyType;

  @IsOptional()
  @IsUUID("4")
  managerUserId?: string;
}


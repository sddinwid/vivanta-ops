import { Transform } from "class-transformer";
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength
} from "class-validator";
import { UserStatus } from "@prisma/client";

export class CreateVendorDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  vendorType?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  tradeCategory?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((entry) => `${entry}`.trim()) : value
  )
  serviceRegions?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  taxId?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}


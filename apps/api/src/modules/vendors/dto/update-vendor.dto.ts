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

export class UpdateVendorDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  vendorType?: string | null;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  tradeCategory?: string | null;

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
  taxId?: string | null;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}


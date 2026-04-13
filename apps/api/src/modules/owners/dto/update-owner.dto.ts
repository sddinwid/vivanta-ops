import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength
} from "class-validator";
import { UserStatus } from "@prisma/client";

export class UpdateOwnerDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  displayName?: string;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string | null;

  @IsOptional()
  @IsBoolean()
  isCompany?: boolean;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}


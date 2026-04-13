import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateBuildingDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  buildingCode?: string | null;
}


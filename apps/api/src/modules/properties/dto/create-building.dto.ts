import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateBuildingDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  buildingCode?: string;
}


import { IsOptional, IsString, MaxLength } from "class-validator";

export class ReprocessDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}


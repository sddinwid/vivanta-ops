import { ValidateIf, IsUUID } from "class-validator";

export class AssignWorkOrderVendorDto {
  @ValidateIf((_, value) => value !== null)
  @IsUUID("4")
  vendorId!: string | null;
}


import { IsArray, IsOptional, IsUUID } from "class-validator";

export class SubmitInvoiceForApprovalDto {
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  approverUserIds?: string[];
}


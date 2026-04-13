import { Injectable } from "@nestjs/common";
import { Vendor } from "@prisma/client";

@Injectable()
export class VendorMapper {
  static toResponse(vendor: Vendor) {
    return {
      id: vendor.id,
      organizationId: vendor.organizationId,
      name: vendor.name,
      vendorType: vendor.vendorType,
      email: vendor.email,
      phone: vendor.phone,
      tradeCategory: vendor.tradeCategory,
      serviceRegions: vendor.serviceRegions,
      taxId: vendor.taxId,
      status: vendor.status,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt
    };
  }
}


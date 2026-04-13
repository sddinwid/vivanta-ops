import { Injectable } from "@nestjs/common";
import { Property } from "@prisma/client";

@Injectable()
export class PropertyMapper {
  static toResponse(property: Property) {
    return {
      id: property.id,
      organizationId: property.organizationId,
      propertyCode: property.propertyCode,
      name: property.name,
      street: property.street,
      city: property.city,
      postalCode: property.postalCode,
      countryCode: property.countryCode,
      status: property.status,
      propertyType: property.propertyType,
      managerUserId: property.managerUserId,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt
    };
  }
}


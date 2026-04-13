import { Injectable } from "@nestjs/common";
import { Building } from "@prisma/client";

@Injectable()
export class BuildingMapper {
  static toResponse(building: Building) {
    return {
      id: building.id,
      propertyId: building.propertyId,
      name: building.name,
      buildingCode: building.buildingCode,
      createdAt: building.createdAt,
      updatedAt: building.updatedAt
    };
  }
}


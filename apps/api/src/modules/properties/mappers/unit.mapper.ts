import { Injectable } from "@nestjs/common";
import { Unit } from "@prisma/client";

@Injectable()
export class UnitMapper {
  static toResponse(unit: Unit) {
    return {
      id: unit.id,
      propertyId: unit.propertyId,
      buildingId: unit.buildingId,
      unitNumber: unit.unitNumber,
      floorLabel: unit.floorLabel,
      unitType: unit.unitType,
      squareMeters: unit.squareMeters,
      bedroomCount: unit.bedroomCount,
      bathroomCount: unit.bathroomCount,
      occupancyStatus: unit.occupancyStatus,
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt
    };
  }
}


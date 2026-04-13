import { Injectable, NotFoundException } from "@nestjs/common";
import { UserStatus } from "@prisma/client";
import { AuditService } from "../../audit/services/audit.service";
import { CreateVendorDto } from "../dto/create-vendor.dto";
import { UpdateVendorDto } from "../dto/update-vendor.dto";
import { VendorFiltersDto } from "../dto/vendor-filters.dto";
import { VendorMapper } from "../mappers/vendor.mapper";
import { VendorsRepository } from "../repositories/vendors.repository";

@Injectable()
export class VendorsService {
  constructor(
    private readonly vendorsRepository: VendorsRepository,
    private readonly auditService: AuditService
  ) {}

  async listScoped(organizationId: string, filters: VendorFiltersDto) {
    const [vendors, total] = await Promise.all([
      this.vendorsRepository.listByOrganization(organizationId, filters),
      this.vendorsRepository.countByOrganization(organizationId, filters)
    ]);
    return {
      data: vendors.map(VendorMapper.toResponse),
      meta: {
        total,
        limit: filters.limit ?? 25,
        offset: filters.offset ?? 0
      }
    };
  }

  async getByIdScoped(organizationId: string, vendorId: string) {
    const vendor = await this.vendorsRepository.findByIdScoped(
      vendorId,
      organizationId
    );
    if (!vendor) {
      throw new NotFoundException("Vendor not found");
    }
    return VendorMapper.toResponse(vendor);
  }

  async createScoped(params: {
    organizationId: string;
    actorUserId: string;
    dto: CreateVendorDto;
    requestId?: string;
  }) {
    const { organizationId, actorUserId, dto, requestId } = params;
    const vendor = await this.vendorsRepository.create({
      organization: { connect: { id: organizationId } },
      name: dto.name,
      vendorType: dto.vendorType,
      email: dto.email,
      phone: dto.phone,
      tradeCategory: dto.tradeCategory,
      serviceRegions: dto.serviceRegions ?? [],
      taxId: dto.taxId,
      status: dto.status ?? UserStatus.ACTIVE
    });

    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "vendor.create",
      entityType: "Vendor",
      entityId: vendor.id,
      newValues: VendorMapper.toResponse(vendor),
      metadata: { requestId }
    });

    return VendorMapper.toResponse(vendor);
  }

  async updateScoped(params: {
    organizationId: string;
    vendorId: string;
    actorUserId: string;
    dto: UpdateVendorDto;
    requestId?: string;
  }) {
    const { organizationId, vendorId, actorUserId, dto, requestId } = params;
    const existing = await this.vendorsRepository.findByIdScoped(
      vendorId,
      organizationId
    );
    if (!existing) {
      throw new NotFoundException("Vendor not found");
    }

    const updated = await this.vendorsRepository.update(vendorId, {
      name: dto.name,
      vendorType: dto.vendorType,
      email: dto.email,
      phone: dto.phone,
      tradeCategory: dto.tradeCategory,
      serviceRegions: dto.serviceRegions,
      taxId: dto.taxId,
      status: dto.status
    });

    await this.auditService.record({
      organizationId,
      actorUserId,
      actionType: "vendor.update",
      entityType: "Vendor",
      entityId: updated.id,
      oldValues: VendorMapper.toResponse(existing),
      newValues: VendorMapper.toResponse(updated),
      metadata: { requestId }
    });

    return VendorMapper.toResponse(updated);
  }
}


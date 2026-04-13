import { Injectable, NotFoundException } from "@nestjs/common";
import { OrganizationsRepository } from "../repositories/organizations.repository";

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly organizationsRepository: OrganizationsRepository
  ) {}

  async listForScopedUser(organizationId: string) {
    return this.organizationsRepository.listByIds([organizationId]);
  }

  async getByIdScoped(
    organizationId: string,
    requestedOrganizationId: string
  ) {
    if (organizationId !== requestedOrganizationId) {
      throw new NotFoundException("Organization not found");
    }
    const organization =
      await this.organizationsRepository.findById(requestedOrganizationId);
    if (!organization) {
      throw new NotFoundException("Organization not found");
    }
    return organization;
  }
}


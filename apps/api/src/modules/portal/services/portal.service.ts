import { Injectable, NotFoundException } from "@nestjs/common";
import { RequestIdentity } from "../../../common/request-context/request-context.types";
import { PortalCaseFiltersDto } from "../dto/portal-case-filters.dto";
import { PortalCommunicationFiltersDto } from "../dto/portal-communication-filters.dto";
import { PortalDocumentFiltersDto } from "../dto/portal-document-filters.dto";
import { PortalPropertyFiltersDto } from "../dto/portal-property-filters.dto";
import { PortalMapper } from "../mappers/portal.mapper";
import { PortalRepository } from "../repositories/portal.repository";
import { PortalAccessService } from "./portal-access.service";

@Injectable()
export class PortalService {
  constructor(
    private readonly portalRepository: PortalRepository,
    private readonly portalAccessService: PortalAccessService
  ) {}

  async me(identity: RequestIdentity) {
    const context = await this.portalAccessService.requirePortalContext(identity);
    return PortalMapper.toMeResponse(context);
  }

  async listProperties(identity: RequestIdentity, filters: PortalPropertyFiltersDto) {
    const context = await this.portalAccessService.requirePortalContext(identity);
    const [properties, total] = await Promise.all([
      this.portalRepository.listOwnerProperties(
        context.ownerId,
        context.organizationId,
        filters
      ),
      this.portalRepository.countOwnerProperties(context.ownerId, context.organizationId)
    ]);

    return {
      data: properties.map(PortalMapper.toPortalProperty),
      meta: {
        total,
        limit: filters.limit ?? 25,
        offset: filters.offset ?? 0
      }
    };
  }

  async getProperty(identity: RequestIdentity, propertyId: string) {
    const context = await this.portalAccessService.requirePortalContext(identity);
    const property = await this.portalRepository.findOwnerPropertyById(
      context.ownerId,
      context.organizationId,
      propertyId
    );

    if (!property) {
      throw new NotFoundException("Property not found");
    }

    return PortalMapper.toPortalProperty(property);
  }

  async listPropertyDocuments(
    identity: RequestIdentity,
    propertyId: string,
    filters: PortalDocumentFiltersDto
  ) {
    const context = await this.portalAccessService.requirePortalContext(identity);
    await this.portalAccessService.assertPropertyAccess(
      context.organizationId,
      context.ownerId,
      propertyId
    );

    const [documents, total] = await Promise.all([
      this.portalRepository.listPropertyDocuments(
        context.organizationId,
        propertyId,
        filters
      ),
      this.portalRepository.countPropertyDocuments(
        context.organizationId,
        propertyId,
        filters
      )
    ]);

    return {
      data: documents.map(PortalMapper.toPortalDocument),
      meta: {
        total,
        limit: filters.limit ?? 25,
        offset: filters.offset ?? 0
      }
    };
  }

  async listPropertyCases(
    identity: RequestIdentity,
    propertyId: string,
    filters: PortalCaseFiltersDto
  ) {
    const context = await this.portalAccessService.requirePortalContext(identity);
    await this.portalAccessService.assertPropertyAccess(
      context.organizationId,
      context.ownerId,
      propertyId
    );

    const [cases, total] = await Promise.all([
      this.portalRepository.listPropertyCases(context.organizationId, propertyId, filters),
      this.portalRepository.countPropertyCases(context.organizationId, propertyId, filters)
    ]);

    return {
      data: cases.map(PortalMapper.toPortalCase),
      meta: {
        total,
        limit: filters.limit ?? 25,
        offset: filters.offset ?? 0
      }
    };
  }

  async listCommunications(identity: RequestIdentity, filters: PortalCommunicationFiltersDto) {
    const context = await this.portalAccessService.requirePortalContext(identity);
    if (filters.propertyId) {
      await this.portalAccessService.assertPropertyAccess(
        context.organizationId,
        context.ownerId,
        filters.propertyId
      );
    }

    const propertyIds = await this.portalAccessService.listAccessiblePropertyIds(
      context.organizationId,
      context.ownerId
    );

    const [threads, total] = await Promise.all([
      this.portalRepository.listCommunications(
        context.organizationId,
        context.ownerId,
        propertyIds,
        filters
      ),
      this.portalRepository.countCommunications(
        context.organizationId,
        context.ownerId,
        propertyIds,
        filters
      )
    ]);

    return {
      data: threads.map(PortalMapper.toPortalCommunication),
      meta: {
        total,
        limit: filters.limit ?? 25,
        offset: filters.offset ?? 0
      }
    };
  }

  async getCommunication(identity: RequestIdentity, threadId: string) {
    const context = await this.portalAccessService.requirePortalContext(identity);
    const propertyIds = await this.portalAccessService.listAccessiblePropertyIds(
      context.organizationId,
      context.ownerId
    );

    const thread = await this.portalRepository.findCommunicationById(
      context.organizationId,
      context.ownerId,
      propertyIds,
      threadId
    );

    if (!thread) {
      throw new NotFoundException("Communication thread not found");
    }

    return PortalMapper.toPortalCommunication(thread);
  }
}

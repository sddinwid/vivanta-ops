import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards
} from "@nestjs/common";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequestIdentity } from "../../../common/request-context/request-context.types";
import { PortalCaseFiltersDto } from "../dto/portal-case-filters.dto";
import { PortalCommunicationFiltersDto } from "../dto/portal-communication-filters.dto";
import { PortalDocumentFiltersDto } from "../dto/portal-document-filters.dto";
import { PortalPropertyFiltersDto } from "../dto/portal-property-filters.dto";
import { PortalService } from "../services/portal.service";

@Controller("portal")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("portal.read")
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Get("me")
  me(@CurrentUser() identity: RequestIdentity): Promise<unknown> {
    return this.portalService.me(identity);
  }

  @Get("properties")
  listProperties(
    @CurrentUser() identity: RequestIdentity,
    @Query() filters: PortalPropertyFiltersDto
  ): Promise<unknown> {
    return this.portalService.listProperties(identity, filters);
  }

  @Get("properties/:propertyId")
  getProperty(
    @CurrentUser() identity: RequestIdentity,
    @Param("propertyId", new ParseUUIDPipe()) propertyId: string
  ): Promise<unknown> {
    return this.portalService.getProperty(identity, propertyId);
  }

  @Get("properties/:propertyId/documents")
  listPropertyDocuments(
    @CurrentUser() identity: RequestIdentity,
    @Param("propertyId", new ParseUUIDPipe()) propertyId: string,
    @Query() filters: PortalDocumentFiltersDto
  ): Promise<unknown> {
    return this.portalService.listPropertyDocuments(identity, propertyId, filters);
  }

  @Get("properties/:propertyId/cases")
  listPropertyCases(
    @CurrentUser() identity: RequestIdentity,
    @Param("propertyId", new ParseUUIDPipe()) propertyId: string,
    @Query() filters: PortalCaseFiltersDto
  ): Promise<unknown> {
    return this.portalService.listPropertyCases(identity, propertyId, filters);
  }

  @Get("communications")
  listCommunications(
    @CurrentUser() identity: RequestIdentity,
    @Query() filters: PortalCommunicationFiltersDto
  ): Promise<unknown> {
    return this.portalService.listCommunications(identity, filters);
  }

  @Get("communications/:threadId")
  getCommunication(
    @CurrentUser() identity: RequestIdentity,
    @Param("threadId", new ParseUUIDPipe()) threadId: string
  ): Promise<unknown> {
    return this.portalService.getCommunication(identity, threadId);
  }
}

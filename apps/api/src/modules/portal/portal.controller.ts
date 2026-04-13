import { Controller, Get } from '@nestjs/common';
import { PortalService } from './portal.service';

@Controller('portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Get('health')
  health(): { module: string; status: string } {
    return {
      module: 'portal',
      status: this.portalService.getStatus()
    };
  }
}

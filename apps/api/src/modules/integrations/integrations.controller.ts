import { Controller, Get } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('health')
  health(): { module: string; status: string } {
    return {
      module: 'integrations',
      status: this.integrationsService.getStatus()
    };
  }
}

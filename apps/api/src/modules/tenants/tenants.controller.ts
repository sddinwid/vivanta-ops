import { Controller, Get } from '@nestjs/common';
import { TenantsService } from './tenants.service';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('health')
  health(): { module: string; status: string } {
    return {
      module: 'tenants',
      status: this.tenantsService.getStatus()
    };
  }
}

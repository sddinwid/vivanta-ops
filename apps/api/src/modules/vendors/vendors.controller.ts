import { Controller, Get } from '@nestjs/common';
import { VendorsService } from './vendors.service';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get('health')
  health(): { module: string; status: string } {
    return {
      module: 'vendors',
      status: this.vendorsService.getStatus()
    };
  }
}

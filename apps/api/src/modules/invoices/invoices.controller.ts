import { Controller, Get } from '@nestjs/common';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get('health')
  health(): { module: string; status: string } {
    return {
      module: 'invoices',
      status: this.invoicesService.getStatus()
    };
  }
}

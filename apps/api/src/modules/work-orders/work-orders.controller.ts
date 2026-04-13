import { Controller, Get } from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';

@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workordersService: WorkOrdersService) {}

  @Get('health')
  health(): { module: string; status: string } {
    return {
      module: 'work-orders',
      status: this.workordersService.getStatus()
    };
  }
}

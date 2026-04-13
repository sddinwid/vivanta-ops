import { Controller, Get } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';

@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get('health')
  health(): { module: string; status: string } {
    return {
      module: 'approvals',
      status: this.approvalsService.getStatus()
    };
  }
}

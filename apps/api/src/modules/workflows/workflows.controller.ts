import { Controller, Get } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';

@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get('health')
  health(): { module: string; status: string } {
    return {
      module: 'workflows',
      status: this.workflowsService.getStatus()
    };
  }
}

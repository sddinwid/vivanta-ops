import { Controller, Get } from '@nestjs/common';
import { CommunicationsService } from './communications.service';

@Controller('communications')
export class CommunicationsController {
  constructor(private readonly communicationsService: CommunicationsService) {}

  @Get('health')
  health(): { module: string; status: string } {
    return {
      module: 'communications',
      status: this.communicationsService.getStatus()
    };
  }
}

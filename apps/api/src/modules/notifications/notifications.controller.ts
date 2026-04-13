import { Controller, Get } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('health')
  health(): { module: string; status: string } {
    return {
      module: 'notifications',
      status: this.notificationsService.getStatus()
    };
  }
}

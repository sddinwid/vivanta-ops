import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  getStatus(): string {
    return 'notifications module placeholder';
  }
}

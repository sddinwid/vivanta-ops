import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkOrdersService {
  getStatus(): string {
    return 'work-orders module placeholder';
  }
}

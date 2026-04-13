import { Injectable } from '@nestjs/common';

@Injectable()
export class TasksService {
  getStatus(): string {
    return 'tasks module placeholder';
  }
}

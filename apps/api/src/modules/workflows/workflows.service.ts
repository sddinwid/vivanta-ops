import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkflowsService {
  getStatus(): string {
    return 'workflows module placeholder';
  }
}

import { Injectable } from '@nestjs/common';

@Injectable()
export class ApprovalsService {
  getStatus(): string {
    return 'approvals module placeholder';
  }
}

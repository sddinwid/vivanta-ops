import { Injectable } from '@nestjs/common';

@Injectable()
export class PortalService {
  getStatus(): string {
    return 'portal module placeholder';
  }
}

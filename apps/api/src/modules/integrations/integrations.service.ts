import { Injectable } from '@nestjs/common';

@Injectable()
export class IntegrationsService {
  getStatus(): string {
    return 'integrations module placeholder';
  }
}

import { Injectable } from '@nestjs/common';

@Injectable()
export class CommunicationsService {
  getStatus(): string {
    return 'communications module placeholder';
  }
}

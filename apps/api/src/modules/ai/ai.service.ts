import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  getStatus(): string {
    return 'ai module placeholder';
  }
}

import { Injectable } from '@nestjs/common';

@Injectable()
export class OwnersService {
  getStatus(): string {
    return 'owners module placeholder';
  }
}

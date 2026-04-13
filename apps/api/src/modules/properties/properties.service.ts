import { Injectable } from '@nestjs/common';

@Injectable()
export class PropertiesService {
  getStatus(): string {
    return 'properties module placeholder';
  }
}

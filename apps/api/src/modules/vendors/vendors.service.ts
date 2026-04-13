import { Injectable } from '@nestjs/common';

@Injectable()
export class VendorsService {
  getStatus(): string {
    return 'vendors module placeholder';
  }
}

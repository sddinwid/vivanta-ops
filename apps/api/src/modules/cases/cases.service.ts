import { Injectable } from '@nestjs/common';

@Injectable()
export class CasesService {
  getStatus(): string {
    return 'cases module placeholder';
  }
}

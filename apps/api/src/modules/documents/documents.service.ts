import { Injectable } from '@nestjs/common';

@Injectable()
export class DocumentsService {
  getStatus(): string {
    return 'documents module placeholder';
  }
}

import { Injectable } from '@nestjs/common';

@Injectable()
export class InvoicesService {
  getStatus(): string {
    return 'invoices module placeholder';
  }
}

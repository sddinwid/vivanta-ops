import { Injectable } from '@nestjs/common';

@Injectable()
export class TenantsService {
  getStatus(): string {
    return 'tenants module placeholder';
  }
}

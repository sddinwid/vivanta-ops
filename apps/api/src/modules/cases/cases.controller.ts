import { Controller, Get } from '@nestjs/common';
import { CasesService } from './cases.service';

@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get('health')
  health(): { module: string; status: string } {
    return {
      module: 'cases',
      status: this.casesService.getStatus()
    };
  }
}

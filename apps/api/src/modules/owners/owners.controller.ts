import { Controller, Get } from '@nestjs/common';
import { OwnersService } from './owners.service';

@Controller('owners')
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) {}

  @Get('health')
  health(): { module: string; status: string } {
    return {
      module: 'owners',
      status: this.ownersService.getStatus()
    };
  }
}

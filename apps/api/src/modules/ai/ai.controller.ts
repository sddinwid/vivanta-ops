import { Controller, Get } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('health')
  health(): { module: string; status: string } {
    return {
      module: 'ai',
      status: this.aiService.getStatus()
    };
  }
}

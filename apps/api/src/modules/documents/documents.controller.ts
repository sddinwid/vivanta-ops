import { Controller, Get } from '@nestjs/common';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('health')
  health(): { module: string; status: string } {
    return {
      module: 'documents',
      status: this.documentsService.getStatus()
    };
  }
}

import { Controller, Get } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('health')
  health(): { module: string; status: string } {
    return {
      module: 'tasks',
      status: this.tasksService.getStatus()
    };
  }
}

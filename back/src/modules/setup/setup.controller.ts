import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SetupService } from './setup.service';
import type { SetupProps } from './setup.types';

@ApiTags('setup')
@Controller('setup')
export class SetupController {
  constructor(private readonly service: SetupService) {}

  @Post()
  async setup(@Body() data: SetupProps) {
    return this.service.setup(data);
  }
}

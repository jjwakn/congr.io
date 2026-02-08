import { Module, ModuleAction } from 'src/utils/constants';
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PermissionDecorator } from '../permission/permission.guard';
import { FeatureService } from './feature.service';

@ApiTags('features')
@Controller('features')
export class FeatureController {
  constructor(private readonly service: FeatureService) {}

  @PermissionDecorator(Module.congregation, ModuleAction.get)
  @Get()
  list() {
    return this.service.list();
  }
}

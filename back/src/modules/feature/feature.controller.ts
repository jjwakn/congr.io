import { Module, ModuleAction } from 'src/utils/constants';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import {
  PermissionDecorator,
  PermissionGuard,
} from '../permission/permission.guard';
import { FeatureService } from './feature.service';

@ApiTags('features')
@Controller('features')
export class FeatureController {
  constructor(private readonly service: FeatureService) {}

  @UseGuards(AuthGuard, PermissionGuard)
  @PermissionDecorator(Module.congregation, ModuleAction.get)
  @Get()
  list() {
    return this.service.list();
  }
}

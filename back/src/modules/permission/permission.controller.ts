import { Module, ModuleAction } from 'src/utils/constants';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionDecorator, PermissionGuard } from './permission.guard';
import { PermissionService } from './permission.service';

@ApiTags('permissions')
@Controller('permissions')
export class PermissionController {
  constructor(private readonly service: PermissionService) {}

  @UseGuards(AuthGuard, PermissionGuard)
  @PermissionDecorator(Module.role, ModuleAction.get)
  @Get()
  list() {
    return this.service.list();
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @PermissionDecorator(Module.role, ModuleAction.get)
  @Get('actions')
  listActions() {
    return this.service.listActions();
  }
}

import { CommonController } from 'src/common/common.controller';
import { Module } from 'src/utils/constants';
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from './role.entity';
import { RoleService } from './role.service';
import { RoleQuery } from './role.types';

@ApiTags('role')
@Controller('role')
export class RoleController extends CommonController<Role, RoleQuery> {
  protected module = Module.role;

  constructor(protected readonly service: RoleService) {
    super();
  }
}

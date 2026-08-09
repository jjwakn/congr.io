import type { RequestType } from 'src/common/common.types';
import { AuthGuard } from 'src/modules/auth/auth.guard';
import { PermissionDecorator, PermissionGuard } from 'src/modules/permission/permission.guard';
import { Module, ModuleAction } from 'src/utils/constants';
import { getRequestUserIdOrThrow } from 'src/utils/request';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { RoleCreateDto, RoleQuery, RoleUpdateDto } from './role.types';

@ApiTags('role')
@Controller('role')
@UseGuards(AuthGuard, PermissionGuard)
export class RoleController {
  constructor(private readonly service: RoleService) {}

  @PermissionDecorator(Module.role, ModuleAction.get)
  @Get()
  list(@Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) query: RoleQuery) {
    return this.service.list(query);
  }

  @PermissionDecorator(Module.role, ModuleAction.get)
  @Get(':id')
  get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.get({ id });
  }

  @PermissionDecorator(Module.role, ModuleAction.create)
  @Post()
  create(
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) data: RoleCreateDto,
    @Req() request: RequestType,
  ) {
    return this.service.create({ data, userId: getRequestUserIdOrThrow(request) });
  }

  @PermissionDecorator(Module.role, ModuleAction.update)
  @Put(':id')
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) data: RoleUpdateDto,
    @Req() request: RequestType,
  ) {
    return this.service.update({ id, data, userId: getRequestUserIdOrThrow(request) });
  }

  @PermissionDecorator(Module.role, ModuleAction.delete)
  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Req() request: RequestType) {
    return this.service.remove({ id, userId: getRequestUserIdOrThrow(request) });
  }
}

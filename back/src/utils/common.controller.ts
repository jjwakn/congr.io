import { AuthGuard } from 'src/modules/auth/auth.guard';
import {
  CommonPermissionDecorator,
  PermissionGuard,
} from 'src/modules/permission/permission.guard';
import type {
  CommonEntity,
  HeadersType,
  ListParamsQuery,
} from 'src/utils/common.types';
import { Module, ModuleAction } from 'src/utils/constants';
import { decodeToken } from 'src/utils/helpers';
import {
  Body,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';

export abstract class CommonController<Entity, Query extends ListParamsQuery> {
  protected abstract service: {
    list(query: Query): Promise<{
      result: Entity[];
      total: number;
    }>;
    get(id: string): Promise<Entity & CommonEntity>;
    create(params: { data: Entity; userId: string }): Promise<Entity>;
    update(params: {
      id: string;
      data: Entity;
      userId: string;
    }): Promise<Entity & CommonEntity>;
    remove(params: { id: string; userId: string }): Promise<{
      deleted: boolean;
    }>;
  };

  protected abstract module: Module;

  @UseGuards(AuthGuard, PermissionGuard)
  @CommonPermissionDecorator(
    (ctrl: CommonController<Entity, Query>) => ctrl.module,
    ModuleAction.get,
  )
  @Get()
  async list(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: Query,
  ) {
    return this.service.list(query);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @CommonPermissionDecorator(
    (ctrl: CommonController<Entity, Query>) => ctrl.module,
    ModuleAction.get,
  )
  @Get(':id')
  async get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.get(id);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @CommonPermissionDecorator(
    (ctrl: CommonController<Entity, Query>) => ctrl.module,
    ModuleAction.create,
  )
  @Post()
  @ApiBody({ type: Object }) // Can be overridden in child controllers
  async create(@Body() data: Entity, @Headers() headers: HeadersType) {
    const userId = decodeToken(headers.authorization).user.id;
    return this.service.create({ data, userId });
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @CommonPermissionDecorator(
    (ctrl: CommonController<Entity, Query>) => ctrl.module,
    ModuleAction.update,
  )
  @Put(':id')
  @ApiBody({ type: Object })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: Entity,
    @Headers() headers: HeadersType,
  ) {
    const userId = decodeToken(headers.authorization).user.id;
    return this.service.update({ id, data, userId });
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @CommonPermissionDecorator(
    (ctrl: CommonController<Entity, Query>) => ctrl.module,
    ModuleAction.delete,
  )
  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Headers() headers: HeadersType,
  ) {
    const userId = decodeToken(headers.authorization).user.id;
    return this.service.remove({ id, userId });
  }
}

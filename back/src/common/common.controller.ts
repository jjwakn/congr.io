import { I18nContext } from 'nestjs-i18n';
import type {
  CommonEntity,
  DefaultGetData,
  ListParamsQuery,
  RequestType,
} from 'src/common/common.types';
import { AuthGuard } from 'src/modules/auth/auth.guard';
import {
  CommonPermissionDecorator,
  PermissionGuard,
} from 'src/modules/permission/permission.guard';
import { Module, ModuleAction } from 'src/utils/constants';
import {
  Body,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';

export abstract class CommonController<
  Entity,
  Query extends ListParamsQuery,
  GetData extends DefaultGetData = DefaultGetData,
> {
  protected abstract service: {
    list(query: Query): Promise<{
      result: Entity[];
      total: number;
    }>;
    get(data: GetData): Promise<Entity & CommonEntity>;
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

  private buildUnauthorizedException() {
    const message = I18nContext.current()?.t('errors.auth.notIncluded');
    return new UnauthorizedException(
      typeof message === 'string' ? message : 'Unauthorized',
    );
  }

  // @UseGuards(AuthGuard, PermissionGuard)
  @UseGuards(AuthGuard)
  // @CommonPermissionDecorator(
  //   (ctrl: CommonController<Entity, Query>) => ctrl.module,
  //   ModuleAction.get,
  // )
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
    return this.service.get({ id } as GetData);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @CommonPermissionDecorator(
    (ctrl: CommonController<Entity, Query>) => ctrl.module,
    ModuleAction.create,
  )
  @Post()
  @ApiBody({ type: Object }) // Can be overridden in child controllers
  async create(@Body() data: Entity, @Req() request: RequestType) {
    const userId = request.user?.userId;
    if (!userId) throw this.buildUnauthorizedException();
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
    @Req() request: RequestType,
  ) {
    const userId = request.user?.userId;
    if (!userId) throw this.buildUnauthorizedException();
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
    @Req() request: RequestType,
  ) {
    const userId = request.user?.userId;
    if (!userId) throw this.buildUnauthorizedException();
    return this.service.remove({ id, userId });
  }
}

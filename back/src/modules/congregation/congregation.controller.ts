import type { HeadersType } from 'src/utils/common.types';
import { Module, ModuleAction } from 'src/utils/constants';
import { decodeToken } from 'src/utils/helpers';
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { Permission, PermissionGuard } from '../permission/permission.guard';
import { Congregation } from './congregation.entity';
import { CongregationService } from './congregation.service';
import { CongregationQuery } from './congregation.types';

@ApiTags('congregation')
@Controller('congregation')
export class CongregationController {
  constructor(private readonly service: CongregationService) {}

  @UseGuards(AuthGuard, PermissionGuard)
  @Permission(Module.congregation, ModuleAction.get)
  @Get()
  list(
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    )
    query: CongregationQuery,
  ) {
    return this.service.list(query);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Permission(Module.congregation, ModuleAction.get)
  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number) {
    return this.service.get(id);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Permission(Module.congregation, ModuleAction.create)
  @Post()
  @ApiBody({ type: Congregation })
  async create(@Body() data: Congregation, @Headers() headers: HeadersType) {
    const userId = decodeToken(headers.authorization).user.id;
    return this.service.create({ data, userId });
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Permission(Module.congregation, ModuleAction.update)
  @Put(':id')
  @ApiBody({ type: Congregation })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Congregation,
    @Headers() headers: HeadersType,
  ) {
    const userId = decodeToken(headers.authorization).user.id;
    return this.service.update({ id, data, userId });
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Permission(Module.congregation, ModuleAction.delete)
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Headers() headers: HeadersType,
  ) {
    const userId = decodeToken(headers.authorization).user.id;
    return this.service.remove({ id, userId });
  }
}

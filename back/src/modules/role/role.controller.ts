import { type HeadersType } from 'src/utils/common.types';
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
import {
  PermissionDecorator,
  PermissionGuard,
} from '../permission/permission.guard';
import { Role } from './role.entity';
import { RoleService } from './role.service';
import { RoleQuery } from './role.types';

@ApiTags('roles')
@Controller('roles')
export class RoleController {
  constructor(private readonly service: RoleService) {}

  @UseGuards(AuthGuard, PermissionGuard)
  @PermissionDecorator(Module.role, ModuleAction.get)
  @Get()
  list(
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    )
    query: RoleQuery,
  ) {
    return this.service.list(query);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @PermissionDecorator(Module.role, ModuleAction.get)
  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number) {
    return this.service.get(id);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @PermissionDecorator(Module.role, ModuleAction.create)
  @Post()
  @ApiBody({ type: Role })
  async create(@Body() data: Role, @Headers() headers: HeadersType) {
    const userId = decodeToken(headers.authorization).user.id;
    return this.service.create({ data, userId });
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @PermissionDecorator(Module.role, ModuleAction.update)
  @Put(':id')
  @ApiBody({ type: Role })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Role,
    @Headers() headers: HeadersType,
  ) {
    const userId = decodeToken(headers.authorization).user.id;
    return this.service.update({ id, data, userId });
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @PermissionDecorator(Module.role, ModuleAction.delete)
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Headers() headers: HeadersType,
  ) {
    const userId = decodeToken(headers.authorization).user.id;
    return this.service.remove({ id, userId });
  }
}

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
  ParseUUIDPipe,
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
  async get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
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
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
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
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Headers() headers: HeadersType,
  ) {
    const userId = decodeToken(headers.authorization).user.id;
    return this.service.remove({ id, userId });
  }
}

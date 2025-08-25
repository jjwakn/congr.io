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
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserQuery, UserValidateProps } from './user.types';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly service: UserService) {}

  @UseGuards(AuthGuard, PermissionGuard)
  @PermissionDecorator(Module.user, ModuleAction.get)
  @Get()
  list(
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    )
    query: UserQuery,
  ) {
    return this.service.list(query);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @PermissionDecorator(Module.user, ModuleAction.get)
  @Get(':id')
  async get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.get({ id });
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @PermissionDecorator(Module.user, ModuleAction.create)
  @Post()
  @ApiBody({ type: User })
  async create(@Body() data: User, @Headers() headers: HeadersType) {
    const userId = decodeToken(headers.authorization).user.id;
    return this.service.create({ data, userId });
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @PermissionDecorator(Module.user, ModuleAction.update)
  @Put(':id')
  @ApiBody({ type: User })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: User,
    @Headers() headers: HeadersType,
  ) {
    const userId = decodeToken(headers.authorization).user.id;
    return this.service.update({ id, data, userId });
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @PermissionDecorator(Module.user, ModuleAction.delete)
  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Headers() headers: HeadersType,
  ) {
    const userId = decodeToken(headers.authorization).user.id;
    return this.service.remove({ id, userId });
  }

  @UseGuards(AuthGuard)
  @Post('/validate')
  @ApiBody({ type: UserValidateProps })
  async validate(@Body() data: UserValidateProps) {
    return this.service.validate(data);
  }
}

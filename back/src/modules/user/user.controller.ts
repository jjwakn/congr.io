import type { RequestType } from 'src/common/common.types';
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
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { UserService } from './user.service';
import { UserCreateDto, UserPreferencesDto, UserQuery, UserSetTemporaryPasswordDto, UserUpdateDto } from './user.types';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly service: UserService) {}

  @UseGuards(AuthGuard, PermissionGuard)
  @PermissionDecorator(Module.user, ModuleAction.get)
  @Get()
  list(
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) query: UserQuery,
    @Req() request: RequestType,
  ) {
    return this.service.list({
      query,
      userId: getRequestUserIdOrThrow(request),
      congregationId: request.headers['x-congregation-id'],
    });
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @PermissionDecorator(Module.user, ModuleAction.get)
  @Get(':id')
  get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Req() request: RequestType) {
    return this.service.get({
      id,
      userId: getRequestUserIdOrThrow(request),
      congregationId: request.headers['x-congregation-id'],
    });
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @PermissionDecorator(Module.user, ModuleAction.create)
  @Post()
  create(
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) data: UserCreateDto,
    @Req() request: RequestType,
  ) {
    return this.service.create({
      data,
      userId: getRequestUserIdOrThrow(request),
    });
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @PermissionDecorator(Module.user, ModuleAction.update)
  @Put(':id')
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) data: UserUpdateDto,
    @Req() request: RequestType,
  ) {
    return this.service.update({
      id,
      data,
      userId: getRequestUserIdOrThrow(request),
      congregationId: request.headers['x-congregation-id'],
    });
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @PermissionDecorator(Module.user, ModuleAction.delete)
  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Req() request: RequestType) {
    return this.service.remove({
      id,
      userId: getRequestUserIdOrThrow(request),
      congregationId: request.headers['x-congregation-id'],
    });
  }

  @UseGuards(AuthGuard)
  @Get('/me/preferences')
  preferences(@Req() request: RequestType) {
    return this.service.getPreferences(getRequestUserIdOrThrow(request));
  }

  @UseGuards(AuthGuard)
  @Put('/me/preferences')
  updatePreferences(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) data: UserPreferencesDto,
    @Req() request: RequestType,
  ) {
    return this.service.updatePreferences({ data, userId: getRequestUserIdOrThrow(request) });
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @PermissionDecorator(Module.user, ModuleAction.change_password)
  @Put(':id/temporary-password')
  @ApiBody({ type: UserSetTemporaryPasswordDto })
  async setTemporaryPassword(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    data: UserSetTemporaryPasswordDto,
    @Req() request: RequestType,
  ) {
    return this.service.setTemporaryPassword({
      id,
      data,
      userId: getRequestUserIdOrThrow(request),
      congregationId: request.headers['x-congregation-id'],
    });
  }
}

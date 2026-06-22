import { CommonController } from 'src/common/common.controller';
import type { RequestType } from 'src/common/common.types';
import { PermissionDecorator, PermissionGuard } from 'src/modules/permission/permission.guard';
import { Module, ModuleAction } from 'src/utils/constants';
import { getRequestUserIdOrThrow } from 'src/utils/request';
import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { User } from './user.entity';
import { UserService } from './user.service';
import {
  UserChangeOwnPasswordDto,
  UserCompleteTemporaryPasswordDto,
  UserGetByIdProps,
  UserPreferencesDto,
  UserQuery,
  UserSetTemporaryPasswordDto,
  UserValidateProps,
} from './user.types';

@ApiTags('user')
@Controller('user')
export class UserController extends CommonController<User, UserQuery, UserGetByIdProps> {
  protected module = Module.user;

  constructor(protected readonly service: UserService) {
    super();
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

  @UseGuards(AuthGuard)
  @Post('/validate')
  @ApiBody({ type: UserValidateProps })
  async validate(@Body() data: UserValidateProps) {
    return this.service.validate(data);
  }

  @UseGuards(AuthGuard)
  @Put('/me/password')
  @ApiBody({ type: UserChangeOwnPasswordDto })
  async changeOwnPassword(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    data: UserChangeOwnPasswordDto,
    @Req() request: RequestType,
  ) {
    return this.service.changeOwnPassword({
      data,
      userId: getRequestUserIdOrThrow(request),
    });
  }

  @UseGuards(AuthGuard)
  @Put('/me/temporary-password')
  @ApiBody({ type: UserCompleteTemporaryPasswordDto })
  async completeTemporaryPassword(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    data: UserCompleteTemporaryPasswordDto,
    @Req() request: RequestType,
  ) {
    return this.service.completeTemporaryPassword({
      data,
      userId: getRequestUserIdOrThrow(request),
    });
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
    });
  }
}

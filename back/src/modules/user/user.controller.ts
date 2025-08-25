import { CommonController } from 'src/utils/common.controller';
import { Module } from 'src/utils/constants';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserGetByIdProps, UserQuery, UserValidateProps } from './user.types';

@ApiTags('users')
@Controller('users')
export class UserController extends CommonController<
  User,
  UserQuery,
  UserGetByIdProps
> {
  protected module = Module.user;

  constructor(protected readonly service: UserService) {
    super();
  }

  @UseGuards(AuthGuard)
  @Post('/validate')
  @ApiBody({ type: UserValidateProps })
  async validate(@Body() data: UserValidateProps) {
    return this.service.validate(data);
  }
}

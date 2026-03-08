import { IsOptional } from 'class-validator';
import { CommonOrder, EntityActionProps, ListParamsQuery } from 'src/common/common.types';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

interface UserGetProps {
  includePassword?: boolean;
}

export interface UserGetByIdProps extends UserGetProps {
  id: string;
}

export interface UserGetByUsernameProps extends UserGetProps {
  username: string;
}

export interface UserCreateProps extends EntityActionProps {
  data: User;
}

export interface UserUpdateProps extends UserCreateProps {
  id: string;
}

export interface UserDeleteProps extends EntityActionProps {
  id: string;
}

enum Order {
  name = 'name',
  username = 'username',
}

export class UserQuery extends ListParamsQuery {
  @ApiProperty({
    required: false,
    example: 'name',
    enum: Order,
  })
  @IsOptional()
  order: Order | CommonOrder = Order.name;
}

export class UserValidateProps {
  @ApiProperty({
    required: true,
    example: 'abc.def.ghi',
  })
  token: string;
}

import { IsOptional } from 'class-validator'
import {
  CommonOrder,
  EntityActionProps,
  ListParamsQuery,
} from 'src/utils/common.types'
import { ApiProperty } from '@nestjs/swagger'
import { User } from './user.entity'

interface UserGetProps {
  includePassword?: boolean
}

export interface UserGetByIdProps extends UserGetProps {
  id: number
}

export interface UserGetByUsernameProps extends UserGetProps {
  username: string
}

export interface UserCreateProps extends EntityActionProps {
  data: User
}

export interface UserUpdateProps extends UserCreateProps {
  id: number
}

export interface UserDeleteProps extends EntityActionProps {
  id: number
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
  order: Order | CommonOrder = Order.name
}

export class UserValidateProps {
  @ApiProperty({
    required: true,
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  token: string
}

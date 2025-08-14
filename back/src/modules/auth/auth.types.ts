import { ApiProperty } from '@nestjs/swagger';
import { UserPermission } from '../permission/permission.types';
import { User } from '../user/user.entity';

export class LoginProps {
  @ApiProperty({
    required: true,
    example: 'admin',
  })
  username: string;

  @ApiProperty({
    required: true,
    example: '1234',
  })
  password: string;
}

export interface UserValidated {
  user: User;
  auth: { token: string; fullAccess: boolean; permissions: UserPermission };
}

export interface JWTPayload {
  sub: string;
  username: string;
}

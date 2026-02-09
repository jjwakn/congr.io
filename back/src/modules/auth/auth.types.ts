import { ApiPropertyI18n } from 'src/common/ApiPropertyI18n';
import { UserPermission } from '../permission/permission.types';
import { User } from '../user/user.entity';

export class LoginProps {
  @ApiPropertyI18n({
    required: true,
    example: 'examples.user.username',
  })
  username: string;

  @ApiPropertyI18n({
    required: true,
    example: 'examples.user.password',
  })
  password: string;
}

export interface AuthLoginResult {
  user: User;
  token: string;
  auth: { fullAccess: boolean; permissions: UserPermission };
}

export type UserValidated = AuthLoginResult;

export interface JWTPayload {
  sub: string;
  username: string;
  auth: {
    fullAccess: boolean;
    permissions: UserPermission;
  };
}

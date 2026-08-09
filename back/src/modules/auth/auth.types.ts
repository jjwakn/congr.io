import { IsByteLength, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiPropertyI18n } from 'src/common/ApiPropertyI18n';
import { MAX_PASSWORD_LENGTH } from 'src/config/security';
import { UserPermission } from '../permission/permission.types';
import { User } from '../user/user.entity';

export class LoginProps {
  @ApiPropertyI18n({
    required: true,
    example: 'examples.user.username',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  username: string;

  @ApiPropertyI18n({
    required: true,
    example: 'examples.user.password',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_PASSWORD_LENGTH)
  @IsByteLength(0, MAX_PASSWORD_LENGTH)
  password: string;

  ip?: string;
}

export interface AuthLoginResult {
  user: User;
  token: string;
  auth: { fullAccess: boolean; permissions: UserPermission };
}

export interface AuthSessionResult {
  user: User;
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
  passwordChangeRequired: boolean;
  sessionVersion: number;
}

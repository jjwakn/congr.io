import { compare } from 'bcrypt';
import { I18nService } from 'nestjs-i18n';
import { mergePermissions } from 'src/utils/helpers';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { AuthLoginResult, LoginProps } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,

    private jwtService: JwtService,

    private readonly i18n: I18nService,
  ) {}

  private sanitizeUser(user: User): User {
    const sanitizedUser = { ...user };
    delete sanitizedUser.password;
    delete sanitizedUser.updated_at;
    delete sanitizedUser.deleted_at;

    return sanitizedUser;
  }

  async validateUser({
    username,
    password,
  }: LoginProps): Promise<AuthLoginResult> {
    const fullUser = await this.userService.getByUsername({
      username,
      includePassword: true,
    });

    const result = await compare(password, fullUser.password ?? '');

    if (!fullUser || !result)
      throw new UnauthorizedException(this.i18n.t('errors.auth.userNotFound'));

    const { roles } = fullUser;

    const { fullAccess, permissions } = mergePermissions(roles);
    const user = this.sanitizeUser(fullUser);
    const tokenUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      created_at: user.created_at,
    };

    const token = this.jwtService.sign({
      sub: user.id,
      username: user.username,
      user: tokenUser,
      auth: {
        fullAccess,
        permissions,
      },
    });

    return {
      user,
      token,
      auth: { fullAccess, permissions },
    };
  }

  async login(data: LoginProps) {
    const result = await this.validateUser(data);

    return result;
  }

  async getCurrentUser(userId: string): Promise<User> {
    const user = await this.userService.get({ id: userId });
    return this.sanitizeUser(user);
  }
}

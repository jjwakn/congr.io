import { compare } from 'bcrypt';
import { mergePermissions } from 'src/utils/helpers';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserPermission } from '../permission/permission.types';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { LoginProps } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    username: string,
    password: string,
  ): Promise<{
    user: User;
    auth: { token: string; fullAccess: boolean; permissions: UserPermission };
  } | null> {
    const fullUser = await this.userService.getByUsername(username, true);

    const result = await compare(password, fullUser.password ?? '');

    if (!fullUser || !result) return null;

    const { roles, ...user } = fullUser;

    delete user.password;
    delete user.updated_at;
    delete user.deleted_at;

    const { fullAccess, permissions } = mergePermissions(roles);

    const token = this.jwtService.sign({
      user,
      auth: {
        fullAccess,
        permissions,
      },
    });

    return {
      user: user as User,
      auth: {
        token,
        fullAccess,
        permissions,
      },
    };
  }

  async login(data: LoginProps) {
    const result = await this.validateUser(data.username, data.password);

    return result;
  }
}

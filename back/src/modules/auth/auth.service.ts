import { compare } from 'bcrypt';
import { I18nService } from 'nestjs-i18n';
import { mergePermissions } from 'src/utils/helpers';
import { IsNull, Repository } from 'typeorm';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { AuthLoginResult, AuthSessionResult, LoginProps } from './auth.types';

const MAX_FAILED_LOGIN_ATTEMPTS = 10;

// Used to keep credential checks timing-consistent for non-existent users.
const DUMMY_PASSWORD_HASH = '$2b$10$LxQj8vHf2yG5REwX8L9i1O8MzY5mQ8I1z6V/8jQv3H3e2W7r9N5gK';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private jwtService: JwtService,

    private readonly i18n: I18nService,
  ) {}

  private sanitizeUser(user: User): User {
    const {
      password: _password,
      updated_at: _updatedAt,
      deleted_at: _deletedAt,
      failed_login_attempts: _failedLoginAttempts,
      locked_at: _lockedAt,
      ...sanitizedUser
    } = user;

    return {
      ...sanitizedUser,
      roles: (sanitizedUser.roles ?? []).filter((r) => r.enabled),
    } as User;
  }

  private getInvalidCredentialsMessage() {
    return this.i18n.t('errors.auth.invalidCredentials');
  }

  private getLockedAccountMessage() {
    return this.i18n.t('errors.auth.accountLockedResetRequired');
  }

  private async registerFailedLoginAttempt(user: User): Promise<boolean> {
    const nextAttempts = (user.failed_login_attempts ?? 0) + 1;
    const shouldLock = nextAttempts > MAX_FAILED_LOGIN_ATTEMPTS;
    const lockedAt = shouldLock ? (user.locked_at ?? new Date()) : (user.locked_at ?? null);

    await this.userRepository.update(
      { id: user.id },
      {
        failed_login_attempts: nextAttempts,
        locked_at: lockedAt,
      },
    );

    user.failed_login_attempts = nextAttempts;
    user.locked_at = lockedAt;

    return Boolean(user.locked_at);
  }

  private async resetFailedLoginAttempt(user: User): Promise<void> {
    if (!user.failed_login_attempts && !user.locked_at) return;

    await this.userRepository.update(
      { id: user.id },
      {
        failed_login_attempts: 0,
        locked_at: null,
      },
    );

    user.failed_login_attempts = 0;
    user.locked_at = null;
  }

  async validateUser({ username, password }: LoginProps): Promise<AuthLoginResult> {
    const fullUser = await this.userRepository.findOne({
      where: {
        username,
        enabled: true,
        deleted_at: IsNull(),
        deleted_by: IsNull(),
      },
      relations: {
        roles: true,
        locations: true,
        congregations: true,
        created_by: true,
        updated_by: true,
        deleted_by: true,
      },
    });

    const compareHash = fullUser?.password ?? DUMMY_PASSWORD_HASH;
    const isPasswordValid = await compare(password, compareHash);

    if (!fullUser || !isPasswordValid) {
      if (fullUser) {
        const isLocked = await this.registerFailedLoginAttempt(fullUser);
        if (isLocked) throw new UnauthorizedException(this.getLockedAccountMessage());
      }

      throw new UnauthorizedException(this.getInvalidCredentialsMessage());
    }

    if (fullUser.locked_at) throw new UnauthorizedException(this.getLockedAccountMessage());

    await this.resetFailedLoginAttempt(fullUser);

    const roles = (fullUser.roles ?? []).filter((r) => r.enabled);

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
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
        enabled: true,
        deleted_at: IsNull(),
        deleted_by: IsNull(),
      },
      relations: {
        roles: true,
        locations: true,
        congregations: true,
        created_by: true,
        updated_by: true,
        deleted_by: true,
      },
    });
    if (!user) throw new UnauthorizedException(this.getInvalidCredentialsMessage());

    return this.sanitizeUser(user);
  }

  async getCurrentSession(userId: string): Promise<AuthSessionResult> {
    const user = await this.getCurrentUser(userId);
    const { fullAccess, permissions } = mergePermissions(user.roles ?? []);

    return {
      user,
      auth: {
        fullAccess,
        permissions,
      },
    };
  }
}

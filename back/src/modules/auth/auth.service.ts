import { compare } from 'bcrypt';
import { I18nService } from 'nestjs-i18n';
import { mergePermissions } from 'src/utils/helpers';
import { IsNull, Repository } from 'typeorm';
import { Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { SecurityAuditService } from '../security/security-audit.service';
import { SecurityRateLimitService } from '../security/security-rate-limit.service';
import { SecurityAuditEvent, SecurityRateLimitScope } from '../security/security.types';
import { User } from '../user/user.entity';
import { AuthLoginResult, AuthSessionResult, LoginProps } from './auth.types';

const LOGIN_BACKOFF_START_ATTEMPT = 5;

// Used to keep credential checks timing-consistent for non-existent users.
const DUMMY_PASSWORD_HASH = '$2b$10$LxQj8vHf2yG5REwX8L9i1O8MzY5mQ8I1z6V/8jQv3H3e2W7r9N5gK';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private jwtService: JwtService,

    private readonly i18n: I18nService,

    private readonly rateLimiter?: SecurityRateLimitService,

    @Optional()
    private readonly securityAudit?: SecurityAuditService,
  ) {}

  private sanitizeUser(user: User): User {
    const {
      password: _password,
      updated_at: _updatedAt,
      deleted_at: _deletedAt,
      failed_login_attempts: _failedLoginAttempts,
      locked_at: _lockedAt,
      session_version: _sessionVersion,
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
    const backoffSeconds =
      nextAttempts >= LOGIN_BACKOFF_START_ATTEMPT
        ? Math.min(15 * 60, 2 ** (nextAttempts - LOGIN_BACKOFF_START_ATTEMPT))
        : 0;
    const lockedAt = backoffSeconds ? new Date(Date.now() + backoffSeconds * 1000) : null;

    if (typeof this.userRepository.query === 'function') {
      await this.userRepository.query(
        `UPDATE "user"
         SET "failed_login_attempts" = "failed_login_attempts" + 1,
             "locked_at" = CASE
               WHEN "failed_login_attempts" + 1 >= $2
               THEN NOW() + make_interval(
                 secs => LEAST(900, POWER(2, "failed_login_attempts" + 1 - $2)::int)
               )
               ELSE NULL
             END
         WHERE "id" = $1`,
        [user.id, LOGIN_BACKOFF_START_ATTEMPT],
      );
    } else {
      await this.userRepository.update(
        { id: user.id },
        {
          failed_login_attempts: nextAttempts,
          locked_at: lockedAt,
        },
      );
    }

    user.failed_login_attempts = nextAttempts;
    user.locked_at = lockedAt;

    return Boolean(lockedAt);
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

  async validateUser({ username, password, ip }: LoginProps): Promise<AuthLoginResult> {
    this.rateLimiter?.assertAllowed(SecurityRateLimitScope.loginIp, ip ?? 'unavailable');
    this.rateLimiter?.assertAllowed(SecurityRateLimitScope.loginAccount, username);
    const fullUser = this.userRepository.createQueryBuilder
      ? await this.userRepository
          .createQueryBuilder('user')
          .addSelect('user.password')
          .leftJoinAndSelect('user.roles', 'roles')
          .leftJoinAndSelect('user.locations', 'locations')
          .leftJoinAndSelect('user.congregations', 'congregations')
          .leftJoinAndSelect('user.created_by', 'created_by')
          .leftJoinAndSelect('user.updated_by', 'updated_by')
          .leftJoinAndSelect('user.deleted_by', 'deleted_by')
          .where('user.username = :username', { username })
          .andWhere('user.enabled = TRUE')
          .andWhere('user.deleted_at IS NULL')
          .andWhere('user.deleted_by IS NULL')
          .getOne()
      : await this.userRepository.findOne({
          where: { username, enabled: true, deleted_at: IsNull(), deleted_by: IsNull() },
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
      let isLocked = false;
      if (fullUser) {
        isLocked = await this.registerFailedLoginAttempt(fullUser);
      }

      this.securityAudit?.record(SecurityAuditEvent.loginFailed, {
        user_id: fullUser?.id ?? null,
        account_known: Boolean(fullUser),
        temporarily_locked: isLocked,
      });
      if (isLocked) throw new UnauthorizedException(this.getLockedAccountMessage());

      throw new UnauthorizedException(this.getInvalidCredentialsMessage());
    }

    if (fullUser.locked_at && fullUser.locked_at.getTime() > Date.now()) {
      throw new UnauthorizedException(this.getLockedAccountMessage());
    }

    await this.resetFailedLoginAttempt(fullUser);
    this.rateLimiter?.reset(SecurityRateLimitScope.loginAccount, username);

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
      sessionVersion: fullUser.session_version ?? 0,
      passwordChangeRequired: fullUser.password_change_required,
    });

    this.securityAudit?.record(SecurityAuditEvent.loginSucceeded, { user_id: user.id });

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

  async createSessionForUser(userId: string): Promise<AuthLoginResult> {
    const currentUser = await this.loadCurrentUser(userId);
    const user = this.sanitizeUser(currentUser);
    const { fullAccess, permissions } = mergePermissions(currentUser.roles ?? []);
    const token = this.jwtService.sign({
      sub: user.id,
      username: user.username,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        created_at: user.created_at,
      },
      auth: { fullAccess, permissions },
      sessionVersion: currentUser.session_version ?? 0,
      passwordChangeRequired: currentUser.password_change_required,
    });
    return { user, token, auth: { fullAccess, permissions } };
  }

  private async loadCurrentUser(userId: string): Promise<User> {
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

    return user;
  }

  async getCurrentUser(userId: string): Promise<User> {
    return this.sanitizeUser(await this.loadCurrentUser(userId));
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

  async revokeSessions(userId: string): Promise<void> {
    await this.userRepository.increment({ id: userId }, 'session_version', 1);
    this.securityAudit?.record(SecurityAuditEvent.sessionRevoked, { user_id: userId });
  }
}

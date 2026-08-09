import { I18nService } from 'nestjs-i18n';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { mergePermissions } from 'src/utils/helpers';
import { IsNull, Repository } from 'typeorm';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { JWTPayload } from './auth.types';

const AUTH_COOKIE_NAME = 'auth_token';

const extractCookieValue = (cookieHeader: string | undefined, key: string): string | null => {
  if (!cookieHeader) return null;

  const chunks = cookieHeader.split(';');
  for (const chunk of chunks) {
    const [rawKey, ...rawValue] = chunk.trim().split('=');
    if (rawKey !== key) continue;
    return decodeURIComponent(rawValue.join('='));
  }

  return null;
};

const cookieTokenExtractor = (request: { headers?: { cookie?: string } }) =>
  extractCookieValue(request?.headers?.cookie, AUTH_COOKIE_NAME);

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly i18n: I18nService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieTokenExtractor, ExtractJwt.fromAuthHeaderAsBearerToken()]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('TOKEN_SECRET') ?? '',
    });
  }

  async validate(payload: JWTPayload) {
    const user = await this.userRepository.findOne({
      where: {
        id: payload.sub,
        enabled: true,
        deleted_at: IsNull(),
        deleted_by: IsNull(),
      },
      relations: { roles: true },
    });
    if (!user || user.session_version !== payload.sessionVersion) {
      throw new UnauthorizedException(this.i18n.t('errors.auth.sessionRevoked'));
    }

    const { fullAccess, permissions } = mergePermissions((user.roles ?? []).filter((role) => role.enabled));
    return {
      userId: user.id,
      username: user.username,
      sessionVersion: user.session_version,
      passwordChangeRequired: user.password_change_required,
      auth: { fullAccess, permissions },
    };
  }
}

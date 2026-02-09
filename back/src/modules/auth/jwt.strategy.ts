import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { JWTPayload } from './auth.types';

const AUTH_COOKIE_NAME = 'auth_token';

const extractCookieValue = (
  cookieHeader: string | undefined,
  key: string,
): string | null => {
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
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieTokenExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('TOKEN_SECRET') ?? '',
    });
  }

  validate(payload: JWTPayload) {
    return {
      userId: payload.sub,
      username: payload.username,
      auth: payload.auth,
    };
  }
}

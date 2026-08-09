import type { NextFunction, Request, Response } from 'express';
import { I18nService } from 'nestjs-i18n';
import { MAX_QUERY_STRING_LENGTH } from './security';

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const AUTH_COOKIE_NAME = 'auth_token';

export const applySecurityHeaders =
  (isProduction: boolean) =>
  (request: Request, response: Response, next: NextFunction): void => {
    const isSwagger = request.path.startsWith('/api-');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.setHeader(
      'Content-Security-Policy',
      isSwagger
        ? "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'"
        : "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    );
    if (isProduction) response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  };

export const enforceRequestBoundaries =
  (corsOrigins: ReadonlySet<string>, i18n: I18nService) =>
  (request: Request, response: Response, next: NextFunction): void => {
    const language = request.get('x-lang') ?? request.get('accept-language')?.split(',')[0];
    const queryLength = request.originalUrl.split('?', 2)[1]?.length ?? 0;
    if (queryLength > MAX_QUERY_STRING_LENGTH) {
      response.status(414).json({
        statusCode: 414,
        message: String(i18n.t('errors.query.tooLong', { lang: language })),
      });
      return;
    }

    const origin = request.get('origin');
    const hasAuthCookie = request.get('cookie')?.includes(`${AUTH_COOKIE_NAME}=`) ?? false;
    if (origin && STATE_CHANGING_METHODS.has(request.method) && hasAuthCookie && !corsOrigins.has(origin)) {
      response.status(403).json({
        statusCode: 403,
        message: String(i18n.t('errors.auth.invalidOrigin', { lang: language })),
      });
      return;
    }
    next();
  };

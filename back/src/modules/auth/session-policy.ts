import { I18nService } from 'nestjs-i18n';
import { ForbiddenException } from '@nestjs/common';

const PASSWORD_CHANGE_ALLOWED_ROUTES = new Set([
  'GET /auth/me',
  'POST /auth/logout',
  'PUT /user/me/temporary-password',
]);

export interface SessionRoutePolicyProps {
  passwordChangeRequired: boolean;
  method: string;
  path: string;
  i18n: Pick<I18nService, 't'>;
}

export const assertSessionRouteAllowed = ({
  passwordChangeRequired,
  method,
  path,
  i18n,
}: SessionRoutePolicyProps): void => {
  if (!passwordChangeRequired) return;

  const normalizedPath = path.split('?')[0].replace(/\/$/, '') || '/';
  if (PASSWORD_CHANGE_ALLOWED_ROUTES.has(`${method.toUpperCase()} ${normalizedPath}`)) return;

  throw new ForbiddenException(i18n.t('errors.auth.passwordChangeRequired'));
};

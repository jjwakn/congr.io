import { I18nContext } from 'nestjs-i18n';
import { RequestType } from 'src/common/common.types';
import { UnauthorizedException } from '@nestjs/common';

export const getRequestUserIdOrThrow = (request: RequestType): string => {
  const userId = request.user?.userId;
  if (userId) return userId;

  const message = I18nContext.current()?.t('errors.auth.notIncluded');
  const fallbackMessage = I18nContext.current()?.t('errors.auth.unauthorized');
  const resolvedMessage =
    typeof message === 'string'
      ? message
      : typeof fallbackMessage === 'string'
        ? fallbackMessage
        : 'errors.auth.unauthorized';

  throw new UnauthorizedException(resolvedMessage);
};

export const getRequestCongregationId = (request: RequestType): string | undefined => {
  const congregationId = request.headers['x-congregation-id']?.trim();
  return congregationId || undefined;
};

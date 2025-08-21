import { I18nService } from 'nestjs-i18n';
import { RequestType } from 'src/utils/common.types';
import { Module, ModuleAction } from 'src/utils/constants';
import { decodeToken } from 'src/utils/helpers';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionMetadata } from './permission.types';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,

    private readonly i18n: I18nService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      const { section, action } = this.reflector.get<PermissionMetadata>(
        'permission',
        context.getHandler(),
      );

      if (!section || !action)
        throw new UnauthorizedException(
          this.i18n.t('errors.permission.undefinedPermission'),
        );

      const request: RequestType = context.switchToHttp().getRequest();
      const token = request.headers.authorization;

      if (!token)
        throw new UnauthorizedException(
          this.i18n.t('errors.token.notIncluded'),
        );

      const { fullAccess, permissions } = decodeToken(token).auth;

      const canDoIt = fullAccess || permissions[section]?.includes(action);

      return !!canDoIt;
    } catch (err) {
      console.error(err);
      throw new UnauthorizedException(this.i18n.t('errors.auth.decodingError'));
    }
  }
}

export const PermissionDecorator = (section: Module, action: ModuleAction) =>
  SetMetadata('permission', { section, action });

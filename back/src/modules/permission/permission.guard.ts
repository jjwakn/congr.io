import { RequestType } from 'src/utils/common.types';
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
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      const { section, action } = this.reflector.get<PermissionMetadata>(
        'permission',
        context.getHandler(),
      );

      if (!section || !action)
        throw new UnauthorizedException('Permission not defined for request');

      const request: RequestType = context.switchToHttp().getRequest();
      const token = request.headers.authorization;

      if (!token)
        throw new UnauthorizedException('Authorization token not included');

      const { fullAccess, permissions } = decodeToken(token).auth;

      const canDoIt = fullAccess || permissions[section]?.includes(action);

      return !!canDoIt;
    } catch (err) {
      console.error(err);
      throw new UnauthorizedException('Error decoding token');
    }
  }
}

export const Permission = (section: string, action: string) =>
  SetMetadata('permission', { section, action });

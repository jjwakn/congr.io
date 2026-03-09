import { I18nService } from 'nestjs-i18n';
import { RequestType } from 'src/common/common.types';
import { Module, ModuleAction } from 'src/utils/constants';
import { decodeToken } from 'src/utils/helpers';
import { CanActivate, ExecutionContext, Injectable, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { PermissionMetadata } from './permission.types';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,

    private readonly i18n: I18nService,
  ) {}

  private resolveModuleFromControllerPath(context: ExecutionContext): Module | null {
    const metadataPath = Reflect.getMetadata(PATH_METADATA, context.getClass());
    const moduleIds = Object.values(Module) as string[];
    const normalizedPath = typeof metadataPath === 'string' ? metadataPath.split('/')[0].trim().toLowerCase() : '';

    if (!normalizedPath) return null;

    const moduleByPath = moduleIds.find((moduleId) => moduleId === normalizedPath || `${moduleId}s` === normalizedPath);

    return (moduleByPath as Module | undefined) ?? null;
  }

  private resolvePermissionSection(section: PermissionMetadata['section'], context: ExecutionContext): Module | null {
    const moduleIds = Object.values(Module) as string[];

    if (typeof section === 'string') return moduleIds.includes(section) ? section : null;

    if (typeof section === 'function') {
      const moduleFromPath = this.resolveModuleFromControllerPath(context);
      if (moduleFromPath) return moduleFromPath;

      const moduleFromResolver = section({});
      return moduleIds.includes(moduleFromResolver) ? moduleFromResolver : null;
    }

    return null;
  }

  canActivate(context: ExecutionContext): boolean {
    try {
      const permissionMetadata = this.reflector.get<PermissionMetadata>('permission', context.getHandler());
      const action = permissionMetadata?.action;
      const section = permissionMetadata ? this.resolvePermissionSection(permissionMetadata.section, context) : null;

      if (!section || !action) throw new UnauthorizedException(this.i18n.t('errors.permission.undefinedPermission'));

      const request: RequestType = context.switchToHttp().getRequest();
      const token = request.headers.authorization;

      const auth = request.user?.auth ?? (token ? decodeToken(token).auth : undefined);

      if (!auth) throw new UnauthorizedException(this.i18n.t('errors.auth.notIncluded'));

      const { fullAccess, permissions } = auth;

      const canDoIt = fullAccess || permissions[section]?.includes(action);

      return !!canDoIt;
    } catch (err) {
      console.error(this.i18n.t('errors.auth.decodingError'), err);
      throw new UnauthorizedException(this.i18n.t('errors.auth.decodingError'));
    }
  }
}

export const PermissionDecorator = (section: Module, action: ModuleAction) => SetMetadata('permission', { section, action });

export const CommonPermissionDecorator = <Entity>(section: (controller: Entity) => Module, action: ModuleAction) =>
  SetMetadata('permission', { section, action });

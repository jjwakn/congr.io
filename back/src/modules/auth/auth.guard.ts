import { I18nService } from 'nestjs-i18n';
import { isObservable, lastValueFrom } from 'rxjs';
import type { RequestType } from 'src/common/common.types';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { assertSessionRouteAllowed } from './session-policy';

@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {
  constructor(private readonly i18n: I18nService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = super.canActivate(context);
    const isAuthenticated = isObservable(result) ? await lastValueFrom(result) : await result;
    if (!isAuthenticated) return false;

    const request = context
      .switchToHttp()
      .getRequest<RequestType & { method: string; originalUrl?: string; url: string }>();
    assertSessionRouteAllowed({
      passwordChangeRequired: Boolean(request.user?.passwordChangeRequired),
      method: request.method,
      path: request.originalUrl ?? request.url,
      i18n: this.i18n,
    });
    return true;
  }
}

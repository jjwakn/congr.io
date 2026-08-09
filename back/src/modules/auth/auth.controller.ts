import type { Request, Response } from 'express';
import { I18nContext } from 'nestjs-i18n';
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from './auth-cookie';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { LoginProps } from './auth.types';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('login')
  @ApiBody({ type: LoginProps })
  async login(
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) data: LoginProps,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.login({ ...data, ip: req.ip });

    res.cookie(AUTH_COOKIE_NAME, result.token, getAuthCookieOptions());

    return {
      user: result.user,
      auth: result.auth,
    };
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async me(@Req() req: Request & { user?: { userId?: string } }) {
    const userId = req.user?.userId;
    const message = I18nContext.current()?.t('errors.auth.notIncluded');
    const fallbackMessage = I18nContext.current()?.t('errors.auth.unauthorized');
    const resolvedMessage =
      typeof message === 'string'
        ? message
        : typeof fallbackMessage === 'string'
          ? fallbackMessage
          : 'errors.auth.unauthorized';
    if (!userId) throw new UnauthorizedException(resolvedMessage);

    return this.service.getCurrentSession(userId);
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(@Req() req: Request & { user?: { userId?: string } }, @Res({ passthrough: true }) res: Response) {
    if (req.user?.userId) await this.service.revokeSessions(req.user.userId);
    res.clearCookie(AUTH_COOKIE_NAME, getAuthCookieOptions());
    return { loggedOut: true };
  }
}

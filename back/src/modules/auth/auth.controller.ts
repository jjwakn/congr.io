import type { Request, Response } from 'express';
import { I18nContext } from 'nestjs-i18n';
import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { LoginProps } from './auth.types';

const AUTH_COOKIE_NAME = 'auth_token';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  private getCookieOptions() {
    const isProd = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
    } as const;
  }

  @Post('login')
  @ApiBody({ type: LoginProps })
  async login(@Body() data: LoginProps, @Res({ passthrough: true }) res: Response) {
    const result = await this.service.login(data);

    res.cookie(AUTH_COOKIE_NAME, result.token, this.getCookieOptions());

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

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(AUTH_COOKIE_NAME, this.getCookieOptions());
    return { loggedOut: true };
  }
}

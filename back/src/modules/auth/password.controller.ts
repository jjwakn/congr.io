import type { Request, Response } from 'express';
import type { RequestType } from 'src/common/common.types';
import { getRequestUserIdOrThrow } from 'src/utils/request';
import { Body, Controller, Put, Req, Res, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { UserService } from '../user/user.service';
import { UserChangeOwnPasswordDto, UserCompleteTemporaryPasswordDto } from '../user/user.types';
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from './auth-cookie';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@ApiTags('user')
@Controller('user')
export class PasswordController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  private async replaceSession(userId: string, response: Response) {
    const session = await this.authService.createSessionForUser(userId);
    response.cookie(AUTH_COOKIE_NAME, session.token, getAuthCookieOptions());
    return { user: session.user, auth: session.auth };
  }

  @UseGuards(AuthGuard)
  @Put('/me/password')
  @ApiBody({ type: UserChangeOwnPasswordDto })
  async changeOwnPassword(
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    data: UserChangeOwnPasswordDto,
    @Req() request: Request & RequestType,
    @Res({ passthrough: true }) response: Response,
  ) {
    const userId = getRequestUserIdOrThrow(request);
    await this.userService.changeOwnPassword({ data, userId });
    return this.replaceSession(userId, response);
  }

  @UseGuards(AuthGuard)
  @Put('/me/temporary-password')
  @ApiBody({ type: UserCompleteTemporaryPasswordDto })
  async completeTemporaryPassword(
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    data: UserCompleteTemporaryPasswordDto,
    @Req() request: Request & RequestType,
    @Res({ passthrough: true }) response: Response,
  ) {
    const userId = getRequestUserIdOrThrow(request);
    await this.userService.completeTemporaryPassword({ data, userId });
    return this.replaceSession(userId, response);
  }
}

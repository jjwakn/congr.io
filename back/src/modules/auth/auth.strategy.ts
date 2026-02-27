import { I18nService } from 'nestjs-i18n';
import { Strategy } from 'passport-local';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginProps, UserValidated } from './auth.types';

@Injectable()
export class AuthStrategy extends PassportStrategy(Strategy) {
  constructor(
    private service: AuthService,

    private readonly i18n: I18nService,
  ) {
    super();
  }

  async validate(data: LoginProps): Promise<UserValidated> {
    const user = await this.service.validateUser(data);

    if (!user)
      throw new UnauthorizedException(
        this.i18n.t('errors.auth.invalidCredentials'),
      );

    return user;
  }
}

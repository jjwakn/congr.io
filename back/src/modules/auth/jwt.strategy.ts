import { ExtractJwt, Strategy } from 'passport-jwt';
import { TOKEN_SECRET } from 'src/utils/constants';
import { PassportStrategy } from '@nestjs/passport';
import { JWTPayload } from './auth.types';

export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: TOKEN_SECRET,
    });
  }

  validate(payload: JWTPayload) {
    return { userId: payload.sub, username: payload.username };
  }
}

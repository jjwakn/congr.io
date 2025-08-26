import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginProps } from './auth.types';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('login')
  // @UseGuards(AuthGuard('local'))
  @ApiBody({ type: LoginProps })
  async login(@Body() data: LoginProps) {
    return this.service.login(data);
  }
}

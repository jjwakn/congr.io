import { compare } from 'bcrypt'
import { I18nService } from 'nestjs-i18n'
import { mergePermissions } from 'src/utils/helpers'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { User } from '../user/user.entity'
import { UserService } from '../user/user.service'
import { LoginProps, UserValidated } from './auth.types'

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,

    private jwtService: JwtService,

    private readonly i18n: I18nService,
  ) {}

  async validateUser({
    username,
    password,
  }: LoginProps): Promise<UserValidated | null> {
    const fullUser = await this.userService.getByUsername({
      username,
      includePassword: true,
    })

    const result = await compare(password, fullUser.password ?? '')

    if (!fullUser || !result)
      throw new UnauthorizedException(this.i18n.t('errors.auth.userNotFound'))

    const { roles, ...user } = fullUser

    delete user.password
    delete user.updated_at
    delete user.deleted_at

    const { fullAccess, permissions } = mergePermissions(roles)

    const token = this.jwtService.sign({
      user,
      auth: {
        fullAccess,
        permissions,
      },
    })

    return {
      user: user as User,
      auth: {
        token,
        fullAccess,
        permissions,
      },
    }
  }

  async login(data: LoginProps) {
    const result = await this.validateUser(data)

    return result
  }
}

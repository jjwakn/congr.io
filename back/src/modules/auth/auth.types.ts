import { ApiPropertyI18n } from 'src/common/decorators/ApiPropertyI18n'
import { UserPermission } from '../permission/permission.types'
import { User } from '../user/user.entity'

export class LoginProps {
  @ApiPropertyI18n({
    required: true,
    example: 'examples.user.username',
  })
  username: string

  @ApiPropertyI18n({
    required: true,
    example: 'examples.user.password',
  })
  password: string
}

export interface UserValidated {
  user: User
  auth: { token: string; fullAccess: boolean; permissions: UserPermission }
}

export interface JWTPayload {
  sub: string
  username: string
}

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'

export function ApiPropertyI18n(options?: ApiPropertyOptions) {
  return applyDecorators(ApiProperty(options))
}

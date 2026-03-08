import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger';

export const ApiPropertyI18n = (options?: ApiPropertyOptions) => {
  return applyDecorators(ApiProperty(options));
};

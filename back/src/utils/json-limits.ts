import { I18nContext } from 'nestjs-i18n';
import type { JsonObject, JsonValue } from 'src/common/common.types';
import { BadRequestException } from '@nestjs/common';

const MAX_JSON_DEPTH = 4;
const MAX_JSON_KEYS = 100;
const MAX_JSON_SERIALIZED_BYTES = 32 * 1024;

const translateValidationError = (key: string): string => {
  const translated = I18nContext.current()?.t(key);
  return typeof translated === 'string' ? translated : key;
};

const countKeys = (value: JsonValue, depth: number): number => {
  if (depth > MAX_JSON_DEPTH) {
    throw new BadRequestException(translateValidationError('errors.validation.jsonTooDeep'));
  }
  if (Array.isArray(value)) {
    return value.reduce<number>((total, item) => total + countKeys(item, depth + 1), 0);
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).reduce(
      (total, [, item]) => total + 1 + (item === undefined ? 0 : countKeys(item, depth + 1)),
      0,
    );
  }
  return 0;
};

export const assertJsonWithinLimits = (value: JsonObject): void => {
  if (Buffer.byteLength(JSON.stringify(value), 'utf8') > MAX_JSON_SERIALIZED_BYTES) {
    throw new BadRequestException(translateValidationError('errors.validation.jsonTooLarge'));
  }
  if (countKeys(value, 0) > MAX_JSON_KEYS) {
    throw new BadRequestException(translateValidationError('errors.validation.tooManyJsonFields'));
  }
};

import { createHash, timingSafeEqual } from 'node:crypto';
import { parse, resolve } from 'node:path';

export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 72;
export const MAX_PAGE_SIZE = 500;
export const MAX_SEARCH_LENGTH = 200;
export const MAX_SEARCH_TERMS = 8;
export const MAX_SEARCH_COLUMNS = 20;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_CONGREGATION_STORAGE_BYTES = 500 * 1024 * 1024;
export const MAX_PUBLIC_REGISTRATIONS_PER_EVENT = 1000;
export const MAX_JSON_BODY_BYTES = '1mb';
export const MAX_QUERY_STRING_LENGTH = 2_048;

const MIN_TOKEN_DURATION_MS = 5 * 60 * 1000;
const MAX_TOKEN_DURATION_MS = 24 * 60 * 60 * 1000;
const DURATION_PATTERN = /^(\d+)(s|m|h|d)$/;
const INSECURE_EXAMPLE_SECRETS = new Set([
  'change_me_to_a_long_random_secret',
  'replace_with_a_unique_random_bootstrap_secret',
]);

export interface SecurityEnvironment {
  corsOrigins: string[];
  setupBootstrapSecret: string;
  tokenDuration: string;
  tokenSecret: string;
}

const durationToMilliseconds = (value: string): number => {
  const match = value.match(DURATION_PATTERN);
  if (!match) return Number.NaN;

  const amount = Number(match[1]);
  const multiplier = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]];
  if (!multiplier) return Number.NaN;
  return amount * multiplier;
};

const parseCorsOrigins = (value?: string): string[] =>
  (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
      const parsed = new URL(origin);
      if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin || origin === '*') {
        throw new Error('CORS_ORIGIN contains an invalid origin');
      }
      return parsed.origin;
    });

export const validateSecurityEnvironment = (env: NodeJS.ProcessEnv): SecurityEnvironment => {
  const tokenSecret = env.TOKEN_SECRET?.trim() ?? '';
  const tokenDuration = env.TOKEN_DURATION?.trim() ?? '';
  const setupBootstrapSecret = env.SETUP_BOOTSTRAP_SECRET?.trim() ?? '';
  const tokenDurationMs = durationToMilliseconds(tokenDuration);
  const corsOrigins = parseCorsOrigins(env.CORS_ORIGIN);
  const fileStorageProvider = env.FILE_STORAGE_PROVIDER?.trim().toLowerCase() ?? '';

  if (tokenSecret.length < 32) throw new Error('TOKEN_SECRET must contain at least 32 characters');
  if (
    !Number.isFinite(tokenDurationMs) ||
    tokenDurationMs < MIN_TOKEN_DURATION_MS ||
    tokenDurationMs > MAX_TOKEN_DURATION_MS
  ) {
    throw new Error('TOKEN_DURATION must be between 5 minutes and 24 hours');
  }
  if (setupBootstrapSecret.length < 32) {
    throw new Error('SETUP_BOOTSTRAP_SECRET must contain at least 32 characters');
  }
  if (
    env.NODE_ENV === 'production' &&
    (INSECURE_EXAMPLE_SECRETS.has(tokenSecret) || INSECURE_EXAMPLE_SECRETS.has(setupBootstrapSecret))
  ) {
    throw new Error('Production secrets must not use example placeholder values');
  }
  if (!corsOrigins.length && env.NODE_ENV === 'production') {
    throw new Error('CORS_ORIGIN must contain at least one explicit production origin');
  }
  if (env.NODE_ENV === 'production') {
    if (fileStorageProvider !== 'local' && fileStorageProvider !== 'url') {
      throw new Error('FILE_STORAGE_PROVIDER must be explicitly set to local or url in production');
    }
    if (fileStorageProvider === 'local') {
      const configuredPath = env.FILE_STORAGE_PATH?.trim() ?? '';
      const resolvedPath = resolve(configuredPath || '.');
      if (!configuredPath || resolvedPath === parse(resolvedPath).root) {
        throw new Error('FILE_STORAGE_PATH must be a non-root path in production');
      }
    }
    if (fileStorageProvider === 'url') {
      const publicBaseUrl = new URL(env.FILE_PUBLIC_BASE_URL?.trim() ?? '');
      if (publicBaseUrl.protocol !== 'https:') {
        throw new Error('FILE_PUBLIC_BASE_URL must use HTTPS in production');
      }
    }
  }

  return { corsOrigins, setupBootstrapSecret, tokenDuration, tokenSecret };
};

export const secretsMatch = (provided: string | undefined, expected: string): boolean => {
  if (!provided || !expected) return false;
  const providedDigest = createHash('sha256').update(provided).digest();
  const expectedDigest = createHash('sha256').update(expected).digest();
  return timingSafeEqual(providedDigest, expectedDigest);
};

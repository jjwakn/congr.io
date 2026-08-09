import { I18nService } from 'nestjs-i18n';
import { createHash } from 'node:crypto';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { SecurityRateLimitEntry, SecurityRateLimitPolicy, SecurityRateLimitScope } from './security.types';

const POLICIES: Record<SecurityRateLimitScope, SecurityRateLimitPolicy> = {
  [SecurityRateLimitScope.fileUpload]: { limit: 30, windowMs: 15 * 60_000 },
  [SecurityRateLimitScope.loginAccount]: { limit: 10, windowMs: 15 * 60_000 },
  [SecurityRateLimitScope.loginIp]: { limit: 30, windowMs: 15 * 60_000 },
  [SecurityRateLimitScope.publicEventRead]: { limit: 120, windowMs: 60_000 },
  [SecurityRateLimitScope.publicRegistrationEvent]: { limit: 200, windowMs: 60 * 60_000 },
  [SecurityRateLimitScope.publicRegistrationIp]: { limit: 20, windowMs: 15 * 60_000 },
  [SecurityRateLimitScope.setup]: { limit: 5, windowMs: 15 * 60_000 },
};

@Injectable()
export class SecurityRateLimitService {
  private readonly entries = new Map<string, SecurityRateLimitEntry>();
  private readonly logger = new Logger('Security');
  private operations = 0;

  constructor(private readonly i18n: I18nService) {}

  private buildKey(scope: SecurityRateLimitScope, identifier: string): string {
    const digest = createHash('sha256').update(identifier.trim().toLowerCase()).digest('hex');
    return `${scope}:${digest}`;
  }

  private prune(now: number): void {
    this.operations += 1;
    if (this.operations % 100 !== 0) return;

    for (const [key, entry] of this.entries.entries()) {
      if (entry.expiresAt <= now) this.entries.delete(key);
    }
  }

  assertAllowed(scope: SecurityRateLimitScope, identifier: string): void {
    const now = Date.now();
    this.prune(now);
    const policy = POLICIES[scope];
    const key = this.buildKey(scope, identifier || 'unavailable');
    const existing = this.entries.get(key);
    const entry = !existing || existing.expiresAt <= now ? { count: 0, expiresAt: now + policy.windowMs } : existing;

    entry.count += 1;
    this.entries.set(key, entry);

    if (entry.count <= policy.limit) return;

    this.logger.warn(`rate_limit scope=${scope} subject=${key.slice(-12)}`);
    throw new HttpException(this.i18n.t('errors.auth.rateLimited'), HttpStatus.TOO_MANY_REQUESTS);
  }

  reset(scope: SecurityRateLimitScope, identifier: string): void {
    this.entries.delete(this.buildKey(scope, identifier));
  }
}

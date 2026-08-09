import { Injectable, Logger } from '@nestjs/common';
import { SecurityAuditDetails, SecurityAuditEvent } from './security.types';

const SENSITIVE_KEY_PATTERN = /authorization|cookie|password|secret|token/i;

@Injectable()
export class SecurityAuditService {
  private readonly logger = new Logger('SecurityAudit');

  record(event: SecurityAuditEvent, details: SecurityAuditDetails = {}): void {
    const safeDetails = Object.fromEntries(Object.entries(details).filter(([key]) => !SENSITIVE_KEY_PATTERN.test(key)));
    this.logger.log(JSON.stringify({ event, ...safeDetails }));
  }
}

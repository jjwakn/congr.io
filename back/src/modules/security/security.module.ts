import { Global, Module } from '@nestjs/common';
import { SecurityAuditService } from './security-audit.service';
import { SecurityRateLimitService } from './security-rate-limit.service';

@Global()
@Module({
  providers: [SecurityAuditService, SecurityRateLimitService],
  exports: [SecurityAuditService, SecurityRateLimitService],
})
export class SecurityModule {}

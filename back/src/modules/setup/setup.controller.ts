import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import type { Request } from 'express';
import { I18nLang, I18nService } from 'nestjs-i18n';
import { secretsMatch } from 'src/config/security';
import { BadRequestException, Body, Controller, Get, Headers, Optional, Post, Req } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SecurityAuditService } from '../security/security-audit.service';
import { SecurityRateLimitService } from '../security/security-rate-limit.service';
import { SecurityAuditEvent, SecurityRateLimitScope } from '../security/security.types';
import { SetupService } from './setup.service';
import type { IsSetupResponse, SetupResponse } from './setup.types';
import { SetupPayloadDto, SetupProps } from './setup.types';

@ApiTags('setup')
@Controller('setup')
export class SetupController {
  constructor(
    private readonly service: SetupService,
    private readonly i18n: I18nService,
    private readonly rateLimiter?: SecurityRateLimitService,
    @Optional() private readonly securityAudit?: SecurityAuditService,
  ) {}

  private translate(key: string, lang?: string): string {
    return String(this.i18n.t(key, { lang }));
  }

  private parsePayload(body: (SetupProps & { payload?: string | SetupProps }) | undefined, lang?: string): SetupProps {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException(this.translate('errors.setup.missingBody', lang));
    }

    if (body.payload === undefined || body.payload === null) return body;

    if (typeof body.payload === 'string') {
      try {
        return JSON.parse(body.payload) as SetupProps;
      } catch {
        throw new BadRequestException(this.translate('errors.setup.invalidPayload', lang));
      }
    }

    if (typeof body.payload === 'object') return body.payload;

    throw new BadRequestException(this.translate('errors.setup.invalidPayload', lang));
  }

  @Get()
  async isSetup(): Promise<IsSetupResponse> {
    return this.service.isSetup();
  }

  @Post()
  async setup(
    @Body() body: SetupProps & { payload?: string | SetupProps },
    @Headers('x-bootstrap-secret') bootstrapSecret?: string,
    @I18nLang() lang?: string,
    @Req() request?: Request,
  ): Promise<SetupResponse> {
    this.rateLimiter?.assertAllowed(SecurityRateLimitScope.setup, request?.ip ?? 'unavailable');
    if (!secretsMatch(bootstrapSecret, process.env.SETUP_BOOTSTRAP_SECRET?.trim() ?? '')) {
      this.securityAudit?.record(SecurityAuditEvent.setupRejected, { reason: 'invalid_secret' });
      throw new UnauthorizedException(this.translate('errors.setup.invalidBootstrapSecret', lang));
    }
    const payload = this.parsePayload(body, lang);

    if (!payload?.congregation)
      throw new BadRequestException(this.translate('errors.setup.missingCongregationPayload', lang));

    const parsedBody = plainToInstance(SetupPayloadDto, payload);
    const validationErrors = validateSync(parsedBody, {
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: { target: false, value: false },
    });

    if (validationErrors.length)
      throw new BadRequestException({
        message: this.translate('errors.setup.invalidPayload', lang),
        errors: validationErrors,
      });

    return this.service.setup(parsedBody, lang, bootstrapSecret);
  }
}

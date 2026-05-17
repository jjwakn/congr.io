import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { I18nLang, I18nService } from 'nestjs-i18n';
import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SetupService } from './setup.service';
import type { IsSetupResponse, SetupResponse } from './setup.types';
import { SetupPayloadDto, SetupProps } from './setup.types';

@ApiTags('setup')
@Controller('setup')
export class SetupController {
  constructor(
    private readonly service: SetupService,
    private readonly i18n: I18nService,
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
    @I18nLang() lang?: string,
  ): Promise<SetupResponse> {
    const payload = this.parsePayload(body, lang);

    if (!payload?.congregation)
      throw new BadRequestException(this.translate('errors.setup.missingCongregationPayload', lang));

    const parsedBody = plainToInstance(SetupPayloadDto, payload);
    const validationErrors = validateSync(parsedBody, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (validationErrors.length)
      throw new BadRequestException({
        message: this.translate('errors.setup.invalidPayload', lang),
        errors: validationErrors,
      });

    return this.service.setup(parsedBody, lang);
  }
}

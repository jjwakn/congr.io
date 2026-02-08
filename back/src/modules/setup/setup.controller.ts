import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { SetupService } from './setup.service';
import type { SetupProps, SetupResponse } from './setup.types';

@ApiTags('setup')
@Controller('setup')
export class SetupController {
  constructor(private readonly service: SetupService) {}

  @Get()
  async isSetup() {
    return this.service.isSetup();
  }

  @Post()
  @ApiConsumes('application/json', 'multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logoSmall', maxCount: 1 },
      { name: 'logoLarge', maxCount: 1 },
    ]),
  )
  async setup(
    @Body() body: SetupProps & { payload?: string },
    @UploadedFiles()
    files?: {
      logoSmall?: Array<{ buffer?: Buffer }>;
      logoLarge?: Array<{ buffer?: Buffer }>;
    },
  ): Promise<SetupResponse> {
    const parsedBody = (() => {
      if (typeof body?.payload === 'string') {
        try {
          return JSON.parse(body.payload) as SetupProps;
        } catch {
          throw new BadRequestException('Invalid setup payload');
        }
      }
      return body as SetupProps;
    })();

    if (!parsedBody?.congregation)
      throw new BadRequestException('Missing congregation payload');

    const smallLogo = files?.logoSmall?.[0]?.buffer;
    const largeLogo = files?.logoLarge?.[0]?.buffer;

    if (smallLogo) parsedBody.congregation.logo_small = smallLogo;
    if (largeLogo) parsedBody.congregation.logo_large = largeLogo;

    return this.service.setup(parsedBody);
  }
}

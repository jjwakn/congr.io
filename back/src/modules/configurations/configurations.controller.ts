import type { RequestType } from 'src/common/common.types';
import { AuthGuard } from 'src/modules/auth/auth.guard';
import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { ConfigurationsService } from './configurations.service';
import {
  ThemePaletteConfig,
  ThemePaletteConfigDto,
} from './configurations.types';

@ApiTags('configurations')
@Controller('configurations')
@UseGuards(AuthGuard)
export class ConfigurationsController {
  constructor(private readonly service: ConfigurationsService) {}

  @Get('theme')
  getTheme(@Req() request: RequestType): Promise<ThemePaletteConfig> {
    return this.service.getThemePaletteConfig(request);
  }

  @Put('theme')
  @ApiBody({ type: ThemePaletteConfigDto })
  updateTheme(
    @Req() request: RequestType,
    @Body() payload: ThemePaletteConfigDto,
  ): Promise<ThemePaletteConfig> {
    return this.service.upsertThemePaletteConfig({
      request,
      themePalette: payload,
    });
  }
}

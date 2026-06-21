import type { RequestType } from 'src/common/common.types';
import { AuthGuard } from 'src/modules/auth/auth.guard';
import { PermissionDecorator, PermissionGuard } from 'src/modules/permission/permission.guard';
import { Module, ModuleAction } from 'src/utils/constants';
import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { ConfigurationsService } from './configurations.service';
import { ThemePaletteConfig, ThemePaletteConfigDto } from './configurations.types';

@ApiTags('configurations')
@Controller('configurations')
export class ConfigurationsController {
  constructor(private readonly service: ConfigurationsService) {}

  @UseGuards(AuthGuard, PermissionGuard)
  @PermissionDecorator(Module.congregation, ModuleAction.get)
  @Get('theme')
  getTheme(@Req() request: RequestType): Promise<ThemePaletteConfig> {
    return this.service.getThemePaletteConfig(request);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @PermissionDecorator(Module.congregation, ModuleAction.update)
  @Put('theme')
  @ApiBody({ type: ThemePaletteConfigDto })
  updateTheme(@Req() request: RequestType, @Body() payload: ThemePaletteConfigDto): Promise<ThemePaletteConfig> {
    return this.service.upsertThemePaletteConfig({
      request,
      themePalette: payload,
    });
  }
}

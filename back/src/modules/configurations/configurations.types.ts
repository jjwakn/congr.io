import { Type } from 'class-transformer';
import { IsObject, IsString, Matches, ValidateNested } from 'class-validator';

const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export const THEME_PALETTE_CONFIG_KEY = 'theme_palette';

export class ThemePaletteModeConfigDto {
  @IsString()
  @Matches(HEX_COLOR_REGEX)
  primary: string;

  @IsString()
  @Matches(HEX_COLOR_REGEX)
  secondary: string;

  @IsString()
  @Matches(HEX_COLOR_REGEX)
  backgroundDefault: string;

  @IsString()
  @Matches(HEX_COLOR_REGEX)
  backgroundPaper: string;
}

export class ThemePaletteConfigDto {
  @IsObject()
  @ValidateNested()
  @Type(() => ThemePaletteModeConfigDto)
  light: ThemePaletteModeConfigDto;

  @IsObject()
  @ValidateNested()
  @Type(() => ThemePaletteModeConfigDto)
  dark: ThemePaletteModeConfigDto;
}

export interface ThemePaletteModeConfig {
  primary: string;
  secondary: string;
  backgroundDefault: string;
  backgroundPaper: string;
}

export interface ThemePaletteConfig {
  light: ThemePaletteModeConfig;
  dark: ThemePaletteModeConfig;
}

export const DEFAULT_THEME_PALETTE_CONFIG: ThemePaletteConfig = {
  light: {
    primary: '#1976d2',
    secondary: '#9c27b0',
    backgroundDefault: '#f5f7fb',
    backgroundPaper: '#ffffff',
  },
  dark: {
    primary: '#90caf9',
    secondary: '#ce93d8',
    backgroundDefault: '#121212',
    backgroundPaper: '#1e1e1e',
  },
};

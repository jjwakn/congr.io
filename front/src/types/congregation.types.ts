import { CommonEntity } from './common.types.js';
import { ThemePaletteConfig } from './theme.types.js';

export interface Location extends CommonEntity {
  order: number;
  name: string;
  address: string;
}

export interface Congregation extends CommonEntity {
  id: string;
  name: string;
  type: string;
  timezone: string;
  features?: string[];
  locations: Location[];
  theme_palette?: ThemePaletteConfig;
  max_favorites?: number;
  logo_small_file_id?: string | null;
  logo_big_file_id?: string | null;
}

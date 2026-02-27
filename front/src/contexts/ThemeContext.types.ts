import type { PaletteMode } from '@mui/material';
import type { ThemePaletteConfig } from '../types/theme.types';

export interface ThemeContextType {
  mode: PaletteMode;
  toggleMode: () => void;
  setMode: (mode: PaletteMode) => void;
  paletteConfig: ThemePaletteConfig;
  setPaletteConfig: (config: ThemePaletteConfig) => void;
}

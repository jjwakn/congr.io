import { PaletteMode } from '@mui/material';
import { createContext } from 'react';
import { ThemePaletteConfig } from '../types/theme.types';

type ThemeContextType = {
  mode: PaletteMode;
  toggleMode: () => void;
  setMode: (mode: PaletteMode) => void;
  paletteConfig: ThemePaletteConfig;
  setPaletteConfig: (config: ThemePaletteConfig) => void;
};

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);

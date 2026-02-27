export interface ThemePaletteModeConfig {
  [key: string]: string;
  primary: string;
  secondary: string;
  backgroundDefault: string;
  backgroundPaper: string;
}

export interface ThemePaletteConfig {
  [key: string]: ThemePaletteModeConfig;
  light: ThemePaletteModeConfig;
  dark: ThemePaletteModeConfig;
}

import { CSSProperties, PaletteMode, ThemeOptions, createTheme } from '@mui/material/styles';
import { ThemePaletteConfig, ThemePaletteModeConfig } from '@/types/theme.types';

export const darkGray = '#666';
export const lightGray = '#999';

const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export const smallOptionStyle: CSSProperties = {
  padding: '2px 4px',
  fontSize: '12px',
  minHeight: '0',
};

const components: ThemeOptions['components'] = {
  MuiAppBar: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.primary.main,
      }),
    },
  },
  MuiButton: {
    defaultProps: {
      size: 'small',
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: '1rem',
      },
    },
  },
  MuiFormControl: {
    defaultProps: {
      size: 'small',
    },
  },
  MuiTextField: {
    defaultProps: {
      size: 'small',
    },
  },
  MuiSelect: {
    defaultProps: {
      size: 'small',
      variant: 'outlined',
    },
    variants: [
      {
        props: { size: 'small', variant: 'outlined' },
        style: {
          padding: '2px 4px',
          fontSize: '12px',
        },
      },
    ],
  },
  MuiPaper: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.background.paper,
      }),
    },
  },
};

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

export const isHexColor = (value?: string | null): value is string =>
  typeof value === 'string' && HEX_COLOR_REGEX.test(value.trim());

const normalizeModeConfig = (
  value: Partial<ThemePaletteModeConfig> | undefined,
  defaults: ThemePaletteModeConfig,
): ThemePaletteModeConfig => ({
  primary: isHexColor(value?.primary) ? value.primary : defaults.primary,
  secondary: isHexColor(value?.secondary) ? value.secondary : defaults.secondary,
  backgroundDefault: isHexColor(value?.backgroundDefault) ? value.backgroundDefault : defaults.backgroundDefault,
  backgroundPaper: isHexColor(value?.backgroundPaper) ? value.backgroundPaper : defaults.backgroundPaper,
});

export const normalizeThemePaletteConfig = (
  value: Partial<ThemePaletteConfig> | null | undefined,
): ThemePaletteConfig => ({
  light: normalizeModeConfig(value?.light, DEFAULT_THEME_PALETTE_CONFIG.light),
  dark: normalizeModeConfig(value?.dark, DEFAULT_THEME_PALETTE_CONFIG.dark),
});

export const areThemePaletteConfigsEqual = (left: ThemePaletteConfig, right: ThemePaletteConfig): boolean =>
  JSON.stringify(left) === JSON.stringify(right);

const getModePalette = ({
  mode,
  paletteConfig,
}: {
  mode: PaletteMode;
  paletteConfig: ThemePaletteConfig;
}): ThemePaletteModeConfig => (mode === 'dark' ? paletteConfig.dark : paletteConfig.light);

export const getTheme = ({ mode, paletteConfig }: { mode: PaletteMode; paletteConfig: ThemePaletteConfig }) => {
  const modePalette = getModePalette({ mode, paletteConfig });

  return createTheme({
    palette: {
      mode,
      primary: {
        main: modePalette.primary,
      },
      secondary: {
        main: modePalette.secondary,
      },
      background: {
        default: modePalette.backgroundDefault,
        paper: modePalette.backgroundPaper,
      },
    },
    components,
  });
};

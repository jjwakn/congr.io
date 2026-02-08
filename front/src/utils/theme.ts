import {
  CSSProperties,
  PaletteMode,
  ThemeOptions,
  createTheme,
} from '@mui/material/styles';

export const darkGray = '#666';
export const lightGray = '#999';

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
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: '1rem',
      },
    },
  },
  MuiSelect: {
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
};

export const commonPalette = {
  primary: {
    main: '#1976d2',
    light: '#42a5f5',
    dark: '#0d47a1',
    contrastText: '#ffffff',
  },
};

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    ...commonPalette,
  },
  components,
});

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    ...commonPalette,
  },
  components,
});

export const getTheme = ({ mode }: { mode: PaletteMode }) =>
  mode === 'dark' ? darkTheme : lightTheme;

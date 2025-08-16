import {
  PaletteMode,
  PaletteOptions,
  ThemeOptions,
  createTheme,
} from '@mui/material/styles'

const components: ThemeOptions['components'] = {
  MuiAppBar: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.primary.main,
      }),
    },
  },
}

const commonPalette: PaletteOptions = {
  primary: {
    main: '#1976d2',
    light: '#42a5f5',
    dark: '#0d47a1',
    contrastText: 'white',
  },
}

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    ...commonPalette,
  },
  components,
})

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    ...commonPalette,
  },
  components,
})

export const getTheme = ({ mode }: { mode: PaletteMode }) =>
  mode === 'dark' ? darkTheme : lightTheme

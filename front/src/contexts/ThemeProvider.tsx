import { CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material';
import { PaletteMode } from '@mui/material';
import { ReactNode, useCallback, useMemo, useState } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { THEME_KEY } from '../utils/constants';
import { getTheme } from '../utils/theme';

const getInitialMode = (): PaletteMode => {
  const savedMode = localStorage.getItem(THEME_KEY) as PaletteMode | null;
  if (savedMode === 'dark' || savedMode === 'light') return savedMode;

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

export const ThemeModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<PaletteMode>(getInitialMode);

  const theme = useMemo(() => getTheme({ mode }), [mode]);

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const newMode = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(THEME_KEY, newMode);
      return newMode;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

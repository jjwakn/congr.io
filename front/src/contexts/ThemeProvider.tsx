import { CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material';
import { PaletteMode } from '@mui/material';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { THEME_KEY } from '../utils/constants';
import { getTheme } from '../utils/theme';

export const ThemeModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<PaletteMode>('light');

  const theme = useMemo(() => getTheme({ mode }), [mode]);

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const newMode = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme-mode', newMode);
      return newMode;
    });
  }, []);

  useEffect(() => {
    const savedMode = localStorage.getItem(THEME_KEY) as PaletteMode | null;
    if (savedMode) setMode(savedMode);
    else {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches;

      setMode(prefersDark ? 'dark' : 'light');
    }
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

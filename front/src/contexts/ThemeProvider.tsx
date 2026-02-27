import { CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material';
import { PaletteMode } from '@mui/material';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { ThemePaletteConfig } from '../types/theme.types';
import { THEME_KEY, THEME_PALETTE_UPDATED_EVENT } from '../utils/constants';
import {
  getThemePaletteConfigFromStorage,
  setThemePaletteConfigToStorage,
} from '../utils/storage';
import { getTheme, normalizeThemePaletteConfig } from '../utils/theme';

const getInitialMode = (): PaletteMode => {
  const savedMode = localStorage.getItem(THEME_KEY) as PaletteMode | null;
  if (savedMode === 'dark' || savedMode === 'light') return savedMode;

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

export const ThemeModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<PaletteMode>(getInitialMode);
  const [paletteConfig, setPaletteConfigState] = useState(() =>
    getThemePaletteConfigFromStorage(),
  );

  const theme = useMemo(
    () => getTheme({ mode, paletteConfig }),
    [mode, paletteConfig],
  );

  const setMode = useCallback((nextMode: PaletteMode) => {
    setModeState(nextMode);
    localStorage.setItem(THEME_KEY, nextMode);
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'light' ? 'dark' : 'light');
  }, [mode, setMode]);

  const setPaletteConfig = useCallback((config: ThemePaletteConfig) => {
    const normalized = normalizeThemePaletteConfig(config);
    setPaletteConfigState(normalized);
    setThemePaletteConfigToStorage(normalized);
  }, []);

  useEffect(() => {
    const syncFromStorage = () => {
      setPaletteConfigState(getThemePaletteConfigFromStorage());
    };

    window.addEventListener(THEME_PALETTE_UPDATED_EVENT, syncFromStorage);
    return () => {
      window.removeEventListener(THEME_PALETTE_UPDATED_EVENT, syncFromStorage);
    };
  }, []);

  return (
    <ThemeContext.Provider
      value={{ mode, toggleMode, setMode, paletteConfig, setPaletteConfig }}
    >
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

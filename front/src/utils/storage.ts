import { Congregation } from '../types/congregation.types';
import { ThemePaletteConfig } from '../types/theme.types';
import { CONGREGATION_KEY, IS_SETUP_KEY, THEME_PALETTE_CONFIG_KEY, THEME_PALETTE_UPDATED_EVENT } from './constants';
import { DEFAULT_THEME_PALETTE_CONFIG, normalizeThemePaletteConfig } from './theme';

export const getLocalStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`${key}`, error);
    return defaultValue;
  }
};

export const setLocalStorageItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`${key}`, error);
  }
};

export const getIsSetupFromStorage = (): boolean => {
  return getLocalStorageItem(IS_SETUP_KEY, false);
};

export const setIsSetupToStorage = (value: boolean): void => {
  setLocalStorageItem(IS_SETUP_KEY, value);
};

export const getCongregationFromStorage = (): Congregation | null => {
  return getLocalStorageItem<Congregation | null>(CONGREGATION_KEY, null);
};

export const setCongregationToStorage = (value: Congregation): void => {
  setLocalStorageItem(CONGREGATION_KEY, value);
};

export const clearCongregationFromStorage = (): void => {
  try {
    localStorage.removeItem(CONGREGATION_KEY);
  } catch (error) {
    console.warn(`${CONGREGATION_KEY}`, error);
  }
};

const emitThemePaletteUpdated = (): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(THEME_PALETTE_UPDATED_EVENT));
};

export const getThemePaletteConfigFromStorage = (): ThemePaletteConfig => {
  const stored = getLocalStorageItem<ThemePaletteConfig | null>(THEME_PALETTE_CONFIG_KEY, null);
  return normalizeThemePaletteConfig(stored ?? DEFAULT_THEME_PALETTE_CONFIG);
};

export const setThemePaletteConfigToStorage = (value: ThemePaletteConfig): void => {
  setLocalStorageItem(THEME_PALETTE_CONFIG_KEY, value);
  emitThemePaletteUpdated();
};

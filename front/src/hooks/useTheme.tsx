import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context)
    throw new Error('useThemeMode must be used inside ThemeModeProvider');
  return context;
};

import { ThemeContext } from '@contexts/ThemeContext';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  const { t } = useTranslation();

  if (!context) throw new Error(t('context.error.useTheme'));

  return context;
};

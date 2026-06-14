import { AppContext } from '@contexts/AppContext';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

export const useAppContext = () => {
  const context = useContext(AppContext);
  const { t } = useTranslation();

  if (context === undefined) throw new Error(t('context.error.appContext'));

  return context;
};

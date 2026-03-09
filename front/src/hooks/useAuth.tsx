import { AuthContext } from '@contexts/AuthContext';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

export const useAuth = () => {
  const context = useContext(AuthContext);

  const { t } = useTranslation();

  if (context === undefined) throw new Error(t('context.error.authContext'));

  return context;
};

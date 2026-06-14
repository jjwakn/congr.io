import { SetupContext } from '@contexts/SetupContext';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

export const useSetup = () => {
  const context = useContext(SetupContext);
  const { t } = useTranslation();

  if (context === undefined) {
    throw new Error(t('context.error.useSetup'));
  }
  return context;
};

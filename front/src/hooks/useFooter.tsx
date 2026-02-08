import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { FooterContext } from '../contexts/FooterContext';

export const useFooter = () => {
  const context = useContext(FooterContext);
  const { t } = useTranslation();

  if (context === undefined) throw new Error(t('context.error.footerContext'));

  return context;
};

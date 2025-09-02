import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { NotificationContext } from '../contexts/NotificationContext';

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  const { t } = useTranslation();

  if (context === undefined)
    throw new Error(t('context.error.notificationContext'));

  return context;
};

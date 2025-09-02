import { AlertProps } from '@mui/material';
import { createContext } from 'react';

export type ShowNotificationType = (
  text: string,
  props?: { autohide?: boolean; severity?: AlertProps['severity'] },
) => void;

export interface NotificationContextType {
  showNotification: ShowNotificationType;
}

export const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);

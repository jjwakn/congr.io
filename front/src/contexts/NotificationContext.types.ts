import type { AlertProps } from '@mui/material';

export type ShowNotificationType = (
  text: string,
  props?: { autohide?: boolean; severity?: AlertProps['severity'] },
) => void;

export interface NotificationContextType {
  showNotification: ShowNotificationType;
}

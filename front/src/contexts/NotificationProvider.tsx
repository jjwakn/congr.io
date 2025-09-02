import { Close } from '@mui/icons-material';
import { Alert, AlertProps, IconButton, Snackbar } from '@mui/material';
import { ReactNode, useCallback, useState } from 'react';
import {
  NotificationContext,
  ShowNotificationType,
} from './NotificationContext';

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationText, setNotificationText] = useState('');
  const [notificationDuration, setNotificationDuration] = useState<
    null | number
  >(null);
  const [notificationSeverity, setNotificationSeverity] =
    useState<AlertProps['severity']>('info');

  const showNotification: ShowNotificationType = useCallback(
    (message, { autohide, severity } = { autohide: true }) => {
      setNotificationDuration(autohide ? 6000 : null);
      setNotificationText(message);
      setNotificationOpen(true);
      setNotificationSeverity(severity ?? 'info');
    },
    [],
  );

  const handleCloseNotification = useCallback(() => {
    setNotificationOpen(false);
  }, []);

  const action = (
    <IconButton
      size="small"
      aria-label="close"
      color="inherit"
      onClick={handleCloseNotification}
    >
      <Close fontSize="small" />
    </IconButton>
  );

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
      }}
    >
      {children}

      <Snackbar
        open={notificationOpen}
        autoHideDuration={notificationDuration}
        onClose={handleCloseNotification}
        action={action}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notificationSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notificationText}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

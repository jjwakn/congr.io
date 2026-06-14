import { createContext } from 'react';
import { NotificationContextType, ShowNotificationType } from './NotificationContext.types';

export type { NotificationContextType, ShowNotificationType };

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

import { createContext } from 'react';
import { AppContextType } from './AppContext.types';

export type { AppContextType };

export const AppContext = createContext<AppContextType | undefined>(undefined);

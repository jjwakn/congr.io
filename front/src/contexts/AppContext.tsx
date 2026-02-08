import { createContext } from 'react';

export interface AppContextType {
  isSetup: boolean;
  refreshIsSetup: () => Promise<void>;
  markSetupComplete: () => void;
  isLoading: boolean;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

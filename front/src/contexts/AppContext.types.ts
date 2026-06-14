import type { Congregation } from '@/types/congregation.types';

export interface AppContextType {
  isSetup: boolean;
  congregation: Congregation | null;
  refreshIsSetup: () => Promise<void>;
  markSetupComplete: (congregation: Congregation) => void;
  isLoading: boolean;
}

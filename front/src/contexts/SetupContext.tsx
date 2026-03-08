import { createContext } from 'react';
import { SetupContextType } from './SetupContext.types';

export type { SetupContextType };

export const SetupContext = createContext<SetupContextType | undefined>(undefined);

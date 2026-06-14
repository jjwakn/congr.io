import { createContext } from 'react';
import { AuthContextType, LoginCredentials } from './AuthContext.types';

export type { AuthContextType, LoginCredentials };

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

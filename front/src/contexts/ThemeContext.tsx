import { createContext } from 'react';
import { ThemeContextType } from './ThemeContext.types';

export type { ThemeContextType };

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);

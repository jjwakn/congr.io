import { createContext } from 'react';
import { FooterContextType } from './FooterContext.types';

export type { FooterContextType };

export const FooterContext = createContext<FooterContextType | undefined>(
  undefined,
);

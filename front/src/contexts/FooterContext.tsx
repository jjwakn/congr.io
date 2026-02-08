import { ReactNode, createContext } from 'react';

export interface FooterContextType {
  setChildren: (node: ReactNode | null) => void;
  children: ReactNode | null;
}

export const FooterContext = createContext<FooterContextType | undefined>(
  undefined,
);

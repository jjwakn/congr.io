import type { ReactNode } from 'react';

export interface FooterContextType {
  setChildren: (node: ReactNode | null) => void;
  children: ReactNode | null;
}

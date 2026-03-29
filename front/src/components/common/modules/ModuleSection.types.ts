import type { ReactNode } from 'react';

export interface ModuleSectionProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

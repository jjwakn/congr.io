import { ReactNode, useCallback, useState } from 'react';
import { FooterContext } from './FooterContext';

export const FooterProvider = ({ children }: { children: ReactNode }) => {
  const [node, setNode] = useState<ReactNode | null>(null);

  const addChildren = useCallback((node: ReactNode | null) => {
    setNode(node);
  }, []);

  return (
    <FooterContext.Provider value={{ children: node, setChildren: addChildren }}>{children}</FooterContext.Provider>
  );
};

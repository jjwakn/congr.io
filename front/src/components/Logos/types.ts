import type { SxProps, Theme } from '@mui/material';
import type { ReactNode } from 'react';

export interface LogoProps {
  alt: string;
  size?: number;
  containerSx?: SxProps<Theme>;
  imageSx?: SxProps<Theme>;
}

export interface LogoFrameProps {
  alt: string;
  containerSx?: SxProps<Theme>;
  children: ReactNode;
}

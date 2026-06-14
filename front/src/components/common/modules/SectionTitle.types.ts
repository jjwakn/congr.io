import type { SxProps, Theme, TypographyProps } from '@mui/material';

export interface SectionTitleProps {
  title: string;
  variant?: TypographyProps['variant'];
  sx?: SxProps<Theme>;
}

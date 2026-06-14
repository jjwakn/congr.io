import { Typography } from '@mui/material';
import { SectionTitleProps } from './SectionTitle.types';

export const SectionTitle = ({ title, variant = 'h4', sx }: SectionTitleProps) => (
  <Typography variant={variant} sx={sx ?? {}}>
    {title}
  </Typography>
);

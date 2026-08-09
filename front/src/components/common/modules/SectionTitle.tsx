import { Typography } from '@mui/material';
import { SectionTitleProps } from './SectionTitle.types';

export const SectionTitle = ({ title, variant = 'h4', sx }: SectionTitleProps) => (
  <Typography
    noWrap
    variant={variant}
    sx={[
      {
        fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
        lineHeight: 1.15,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
      ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
    ]}
  >
    {title}
  </Typography>
);

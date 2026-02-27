import { Box, Typography } from '@mui/material';
import { ConfirmSectionProps } from './ConfirmSection.types';

const ConfirmSection = ({ title, children }: ConfirmSectionProps) => (
  <Box
    sx={{
      border: ({ palette }) => `1px solid ${palette.divider}`,
      borderRadius: 2,
      p: 2,
      display: 'flex',
      flexDirection: 'column',
      gap: 1.5,
    }}
  >
    <Typography variant="subtitle1" fontWeight={600}>
      {title}
    </Typography>
    {children}
  </Box>
);

export default ConfirmSection;

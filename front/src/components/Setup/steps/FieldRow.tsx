import { Box, Typography } from '@mui/material';
import { FieldRowProps } from './FieldRow.types';

const FieldRow = ({ label, value }: FieldRowProps) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '120px 1fr', sm: '160px 1fr' },
      gap: 1,
      alignItems: 'start',
      '@media (max-width:420px)': {
        gridTemplateColumns: '1fr',
        gap: 0.5,
      },
    }}
  >
    <Typography variant="body2" color="text.secondary" fontWeight={500}>
      {label}
    </Typography>
    <Box>{value}</Box>
  </Box>
);

export default FieldRow;

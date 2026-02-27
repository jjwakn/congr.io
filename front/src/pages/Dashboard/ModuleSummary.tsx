import { Typography } from '@mui/material';
import { ModuleSummaryProps } from './ModuleSummary.types';

export const ModuleSummary = ({ title, description }: ModuleSummaryProps) => (
  <>
    <Typography variant="h4" gutterBottom>
      {title}
    </Typography>
    <Typography
      variant="body1"
      color="text.secondary"
      sx={{ whiteSpace: 'pre-line' }}
    >
      {description}
    </Typography>
  </>
);

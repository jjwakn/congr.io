import { Box, LinearProgress } from '@mui/material';
import { ProgressProps } from './Progress.types';

const Progress = ({ activeStep }: ProgressProps) => {
  return (
    <Box sx={{ width: '100%', padding: 2 }}>
      <LinearProgress variant="determinate" value={(100 / 5) * activeStep} />
    </Box>
  );
};

export default Progress;

import { LinearProgress } from '@mui/material';
import { ProgressProps } from './Progress.types';

const TOTAL_SETUP_STEPS = 6;

const Progress = ({ activeStep }: ProgressProps) => {
  return (
    <LinearProgress
      variant="determinate"
      value={(100 / TOTAL_SETUP_STEPS) * activeStep}
      sx={{
        width: '100%',
        height: 4,
        borderRadius: 999,
      }}
    />
  );
};

export default Progress;

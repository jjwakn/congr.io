import { LinearProgress } from '@mui/material';
import { ProgressProps } from './Progress.types';

const Progress = ({ activeStep }: ProgressProps) => {
  return (
    <LinearProgress
      variant="determinate"
      value={(100 / 5) * activeStep}
      sx={{
        width: '100%',
        height: 4,
        borderRadius: 999,
      }}
    />
  );
};

export default Progress;

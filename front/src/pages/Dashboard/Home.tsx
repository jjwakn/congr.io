import { Stack, Typography } from '@mui/material';
import { HomeProps } from './Home.types';

export const Home = ({ title, subtitle }: HomeProps) => (
  <Stack spacing={1}>
    <Typography variant="h4">{title}</Typography>
    <Typography variant="body1" color="text.secondary">
      {subtitle}
    </Typography>
  </Stack>
);

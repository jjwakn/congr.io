import { Stack, Typography } from '@mui/material';

type HomeProps = {
  title: string;
  subtitle: string;
};

export const Home = ({ title, subtitle }: HomeProps) => (
  <Stack spacing={1}>
    <Typography variant="h4">{title}</Typography>
    <Typography variant="body1" color="text.secondary">
      {subtitle}
    </Typography>
  </Stack>
);

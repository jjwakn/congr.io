import { Stack, Typography } from '@mui/material';
import { ModuleSectionProps } from './ModuleSection.types';

export const ModuleSection = ({
  title,
  description,
  children,
}: ModuleSectionProps) => (
  <Stack spacing={2}>
    <Stack spacing={0.5}>
      <Typography variant="h4">{title}</Typography>
      {description ? (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ whiteSpace: 'pre-line' }}
        >
          {description}
        </Typography>
      ) : null}
    </Stack>
    {children}
  </Stack>
);

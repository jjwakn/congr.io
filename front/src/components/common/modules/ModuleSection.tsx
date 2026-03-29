import { Stack, Tooltip, Typography } from '@mui/material';
import { ModuleSectionProps } from './ModuleSection.types';

export const ModuleSection = ({ title, description, actions, children }: ModuleSectionProps) => (
  <Stack spacing={2}>
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      justifyContent="space-between"
    >
      {description ? (
        <Tooltip
          title={
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
              {description}
            </Typography>
          }
        >
          <Typography
            variant="h4"
            sx={{
              cursor: 'help',
              textDecoration: 'underline',
              textDecorationStyle: 'dotted',
              textUnderlineOffset: '0.16em',
            }}
          >
            {title}
          </Typography>
        </Tooltip>
      ) : (
        <Typography variant="h4">{title}</Typography>
      )}
      {actions ? (
        <Stack direction="row" spacing={1}>
          {actions}
        </Stack>
      ) : null}
    </Stack>
    {children}
  </Stack>
);

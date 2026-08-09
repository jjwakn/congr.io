import { IconButton, Stack, Tooltip, alpha, useTheme } from '@mui/material';
import { ModuleSectionActionsProps } from './ModuleSectionActions.types';

export const ModuleSectionActions = ({ actions }: ModuleSectionActionsProps) => {
  const theme = useTheme();

  return (
    <Stack direction="row" spacing={{ xs: 0.75, sm: 1 }} alignItems="center" sx={{ flexShrink: 0 }}>
      {actions.map((action) => {
        const Icon = action.icon;
        const paletteKey = action.color && action.color !== 'default' ? action.color : 'action';
        const paletteColor = paletteKey === 'action' ? theme.palette.text.secondary : theme.palette[paletteKey].main;

        return (
          <Tooltip key={action.id} title={action.label}>
            <span>
              <IconButton
                aria-label={action.label}
                disabled={action.disabled}
                onClick={action.onClick}
                size="small"
                sx={{
                  width: { xs: 34, sm: 40 },
                  height: { xs: 34, sm: 40 },
                  borderRadius: '999px',
                  border: '1px solid',
                  borderColor: alpha(paletteColor, 0.28),
                  color: paletteColor,
                  backgroundColor: alpha(paletteColor, 0.06),
                  transition: theme.transitions.create(['background-color', 'border-color']),
                  '&:hover': {
                    backgroundColor: alpha(paletteColor, 0.16),
                    borderColor: alpha(paletteColor, 0.4),
                  },
                  '&.Mui-disabled': {
                    borderColor: theme.palette.action.disabledBackground,
                  },
                }}
              >
                <Icon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        );
      })}
    </Stack>
  );
};
